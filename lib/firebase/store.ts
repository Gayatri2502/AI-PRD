/** Server-only persistence adapter. Every private query must carry its owner filter.
 * Mutations run inside transactions so revision/lease predicates stay atomic. */
import { randomUUID, createHash } from "node:crypto";
import { type Query } from "firebase-admin/firestore";
import { firestore, privateBucket } from "./admin";
type Row = Record<string, any>;
type Result = { data: any; error: any; count?: number };
const tables = new Set([
  "businesses",
  "conversations",
  "uploads",
  "extracted_figures",
  "assumptions",
  "report_versions",
  "jobs",
  "reference_versions",
  "reference_chunks",
  "private_embeddings",
]);
const clean = (data: Row) => JSON.parse(JSON.stringify(data));
class StoreQuery implements PromiseLike<Result> {
  private filters: Array<[string, FirebaseFirestore.WhereFilterOp, unknown]> =
    [];
  private ordering?: [string, boolean];
  private take = 10000;
  private operation = "select";
  private values: Row = {};
  private one = false;
  private counting = false;
  private conflict = "";
  constructor(private table: string) {
    if (!tables.has(table)) throw Error("INPUT: Unknown collection.");
  }
  select(_fields = "*", options?: { count?: string; head?: boolean }) {
    this.counting = !!options?.count;
    return this;
  }
  eq(key: string, value: unknown) {
    this.filters.push([key, "==", value]);
    return this;
  }
  gte(key: string, value: unknown) {
    this.filters.push([key, ">=", value]);
    return this;
  }
  order(key: string, options: { ascending: boolean }) {
    this.ordering = [key, options.ascending];
    return this;
  }
  limit(n: number) {
    this.take = n;
    return this;
  }
  single() {
    this.one = true;
    return this;
  }
  insert(values: Row) {
    this.operation = "insert";
    this.values = values;
    return this;
  }
  upsert(values: Row, options?: { onConflict: string }) {
    this.operation = "upsert";
    this.values = values;
    this.conflict = options?.onConflict || "";
    return this;
  }
  update(values: Row) {
    this.operation = "update";
    this.values = values;
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }
  private query(): Query {
    let q: Query = firestore().collection(this.table);
    for (const [key, op, value] of this.filters) q = q.where(key, op, value);
    return q;
  }
  private async execute(): Promise<Result> {
    try {
      const db = firestore();
      let rows: Row[] = [];
      if (this.operation === "select") {
        const snap = await this.query().get();
        rows = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        if (this.ordering) {
          const [k, asc] = this.ordering;
          rows.sort(
            (a, b) => String(a[k]).localeCompare(String(b[k])) * (asc ? 1 : -1),
          );
        }
        if (this.counting)
          return { data: null, error: null, count: rows.length };
        rows = rows.slice(0, this.take);
      } else if (this.operation === "insert" || this.operation === "upsert") {
        const id =
          this.values.id ||
          (this.conflict
            ? createHash("sha256")
                .update(
                  this.conflict
                    .split(",")
                    .map((k) => String(this.values[k]))
                    .join("|"),
                )
                .digest("hex")
            : randomUUID());
        const ref = db.collection(this.table).doc(id);
        const row = {
          created_at: new Date().toISOString(),
          ...(this.table === "businesses"
            ? { revision: 0, updated_at: new Date().toISOString() }
            : {}),
          ...this.values,
          id,
        };
        if (this.operation === "insert") await ref.create(clean(row));
        else await ref.set(clean(row), { merge: true });
        rows = [row];
      } else {
        rows = await db.runTransaction(async (tx) => {
          const snap = await tx.get(this.query());
          const changed: Row[] = [];
          if (snap.size > 450)
            throw Error("INPUT: Too many records in one mutation.");
          for (const doc of snap.docs) {
            if (this.operation === "delete") tx.delete(doc.ref);
            else tx.update(doc.ref, clean(this.values));
            changed.push({ ...doc.data(), ...this.values, id: doc.id });
          }
          return changed;
        });
      }
      if (this.one && !rows.length)
        return { data: null, error: Error("Not found") };
      return { data: this.one ? rows[0] : rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
async function rpc(name: string, args: Row = {}): Promise<Result> {
  try {
    const db = firestore();
    let data: any;
    if (name === "enqueue_job") {
      data = await db.runTransaction(async (tx) => {
        const day = new Date().toISOString().slice(0, 10);
        const quota = db
          .collection("processing_quotas")
          .doc(`${args.owner_id}_${day}`);
        const business = db.collection("businesses").doc(args.business);
        const [q, b] = await Promise.all([tx.get(quota), tx.get(business)]);
        if (!b.exists || b.data()?.user_id !== args.owner_id)
          throw Error("AUTH: Workspace access denied.");
        const used = q.data()?.count || 0;
        if (used >= Number(process.env.DAILY_JOB_LIMIT || 100))
          throw Error("LIMIT: Daily processing limit reached.");
        const id = randomUUID(),
          now = new Date().toISOString();
        const job = {
          id,
          user_id: args.owner_id,
          business_id: args.business,
          kind: args.job_kind,
          payload: args.job_payload,
          status: "queued",
          attempts: 0,
          max_attempts: 3,
          progress: 0,
          created_at: now,
          available_at: now,
        };
        tx.set(quota, { count: used + 1, user_id: args.owner_id, day });
        tx.create(db.collection("jobs").doc(id), clean(job));
        return job;
      });
    } else if (name === "claim_job") {
      data = await db.runTransaction(async (tx) => {
        const now = new Date().toISOString();
        let queue: Query = db
          .collection("jobs")
          .where("status", "in", ["queued", "running"]);
        if (args.owner_id) queue = queue.where("user_id", "==", args.owner_id);
        const candidates = await tx.get(queue.limit(100));
        const exhausted = candidates.docs.filter((d) => {
          const j = d.data();
          return (
            j.status === "running" &&
            j.lease_until < now &&
            j.attempts >= j.max_attempts
          );
        });
        const ready = candidates.docs
          .filter((d) => {
            const j = d.data();
            return (
              j.attempts < j.max_attempts &&
              (j.status === "queued"
                ? j.available_at <= now
                : j.lease_until < now)
            );
          })
          .sort((a, b) =>
            a.data().created_at.localeCompare(b.data().created_at),
          );
        for (const d of exhausted)
          tx.update(d.ref, {
            status: "failed",
            error: "Processing lease expired. Retry this job.",
            lease_until: null,
          });
        const doc = ready[0];
        if (!doc) return [];
        const job = {
          ...doc.data(),
          id: doc.id,
          status: "running",
          attempts: doc.data().attempts + 1,
          lease_until: new Date(Date.now() + 600000).toISOString(),
        };
        tx.update(doc.ref, job);
        return [job];
      });
    } else if (name === "match_references") {
      const versions = await db
        .collection("reference_versions")
        .where("version", "==", args.version_filter)
        .get();
      const matches: Row[] = [];
      for (const v of versions.docs) {
        const chunks = await db
          .collection("reference_chunks")
          .where("version_id", "==", v.id)
          .get();
        for (const d of chunks.docs) {
          const r = d.data(),
            a = args.query_embedding as number[],
            b = r.embedding as number[];
          if (!Array.isArray(b) || a.length !== b.length) continue;
          const dot = a.reduce((s, x, i) => s + x * b[i], 0),
            norm = Math.sqrt(
              a.reduce((s, x) => s + x * x, 0) *
                b.reduce((s, x) => s + x * x, 0),
            );
          matches.push({
            content: r.content,
            page: r.page,
            url: v.data().url,
            similarity: norm ? dot / norm : 0,
          });
        }
      }
      data = matches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, args.match_count || 5);
    } else throw Error("INPUT: Unknown server operation.");
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
class PrivateStorage {
  async download(path: string): Promise<Result> {
    try {
      const [b] = await privateBucket().file(path).download();
      return { data: new Blob([new Uint8Array(b)]), error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  async upload(
    path: string,
    bytes: Buffer,
    options: { contentType: string; upsert: boolean },
  ): Promise<Result> {
    try {
      await privateBucket()
        .file(path)
        .save(bytes, {
          resumable: false,
          contentType: options.contentType,
          metadata: { cacheControl: "private, no-store" },
        });
      return { data: { path }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  async createSignedUrl(
    path: string,
    seconds: number,
    _options?: unknown,
  ): Promise<Result> {
    try {
      const [signedUrl] = await privateBucket()
        .file(path)
        .getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + seconds * 1000,
          responseDisposition: "attachment",
        });
      return { data: { signedUrl }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  async info(path: string): Promise<Result> {
    try {
      const [m] = await privateBucket().file(path).getMetadata();
      return { data: { size: Number(m.size) }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
export function adminDB() {
  return {
    from: (table: string) => new StoreQuery(table),
    rpc,
    storage: { from: (_bucket: string) => new PrivateStorage() },
  };
}
