import { AsyncLocalStorage } from "node:async_hooks";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "./admin";
export const usageContext = new AsyncLocalStorage<string>();
const day = () => new Date().toISOString().slice(0, 10);
export async function recordTokens(
  input: number,
  output: number,
  total: number,
) {
  const uid = usageContext.getStore();
  if (!uid) return;
  await firestore()
    .collection("ai_usage")
    .doc(`${uid}_${day()}`)
    .set(
      {
        user_id: uid,
        day: day(),
        input: FieldValue.increment(input),
        output: FieldValue.increment(output),
        total: FieldValue.increment(total),
        calls: FieldValue.increment(1),
      },
      { merge: true },
    );
}
export async function usageFor(uid: string) {
  const db = firestore();
  const [tokens, jobs] = await Promise.all([
    db.collection("ai_usage").doc(`${uid}_${day()}`).get(),
    db.collection("processing_quotas").doc(`${uid}_${day()}`).get(),
  ]);
  const data = tokens.data();
  return {
    input: data?.input || 0,
    output: data?.output || 0,
    total: data?.total || 0,
    calls: data?.calls || 0,
    jobs: jobs.data()?.count || 0,
    limit: Number(process.env.DAILY_JOB_LIMIT || 100),
    day: day(),
  };
}
/** Shares the daily application allowance with background processing. */
export async function reserveRequest(uid: string) {
  const db = firestore(),
    ref = db.collection("processing_quotas").doc(`${uid}_${day()}`);
  await db.runTransaction(async (tx) => {
    const old = await tx.get(ref),
      count = old.data()?.count || 0;
    if (count >= Number(process.env.DAILY_JOB_LIMIT || 100))
      throw Error(
        "Daily processing allowance reached. Try again after 00:00 UTC.",
      );
    tx.set(ref, { user_id: uid, day: day(), count: count + 1 });
  });
}
