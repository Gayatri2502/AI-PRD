/** Explicit opt-in; creates and cleans only uniquely named fictional test records. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { authAdmin, firestore } from "../lib/firebase/admin";
import { adminDB } from "../lib/firebase/store";
if (process.env.ALLOW_INTEGRATION_TESTS !== "true")
  throw Error(
    "Set ALLOW_INTEGRATION_TESTS=true to run isolated Firebase checks.",
  );
const db = adminDB(),
  owner = `qa-${randomUUID()}`,
  other = `qa-${randomUUID()}`,
  business = randomUUID();
try {
  await authAdmin().createUser({
    uid: owner,
    displayName: "Folio integration test",
  });
  const token = await authAdmin().createCustomToken(owner);
  assert.ok(token.length > 100);
  const result = await db
    .from("businesses")
    .insert({
      id: business,
      user_id: owner,
      data: { profile: { name: "Fictional QA business" } },
    })
    .single();
  assert.equal(result.error, null);
  assert.equal(
    (
      await db
        .from("businesses")
        .select()
        .eq("id", business)
        .eq("user_id", other)
    ).data.length,
    0,
  );
  const updates = await Promise.all(
    [1, 2].map((n) =>
      db
        .from("businesses")
        .update({ revision: 1, name: `version ${n}` })
        .eq("id", business)
        .eq("user_id", owner)
        .eq("revision", 0),
    ),
  );
  assert.equal(
    updates.reduce((sum, r) => sum + r.data.length, 0),
    1,
    "only one optimistic write wins",
  );
  const denied = await db.rpc("enqueue_job", {
    owner_id: other,
    business,
    job_kind: "report",
    job_payload: {},
  });
  assert.match(denied.error.message, /AUTH/);
  const accepted = await db.rpc("enqueue_job", {
    owner_id: owner,
    business,
    job_kind: "report",
    job_payload: { test: true },
  });
  assert.equal(accepted.error, null);
  const claimed = await db.rpc("claim_job", { owner_id: owner });
  assert.equal(claimed.error, null);
  assert.equal(claimed.data[0].user_id, owner);
  assert.equal(claimed.data[0].attempts, 1);
  // These tests never run global queue claims or inspect other users' data.
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const login = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, returnSecureToken: true }),
    },
  );
  assert.equal(login.status, 200);
  const session = await login.json();
  const cookie = await authAdmin().createSessionCookie(session.idToken, {
    expiresIn: 3600000,
  });
  assert.equal(
    (await authAdmin().verifySessionCookie(cookie, true)).uid,
    owner,
  );
  const rest = await fetch(
    `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/businesses/${business}`,
    { headers: { Authorization: `Bearer ${session.idToken}` } },
  );
  assert.equal(rest.status, 403, "direct client reads must be denied");
  console.log(
    "PASS: Firebase auth/session, Firestore owner filters, concurrent revisions, quota ownership, client-read denial.",
  );
} finally {
  for (const collection of ["businesses", "jobs", "processing_quotas"]) {
    const docs = await firestore()
      .collection(collection)
      .where("user_id", "==", owner)
      .get();
    for (const d of docs.docs) await d.ref.delete();
  }
  await authAdmin()
    .deleteUser(owner)
    .catch(() => {});
}
