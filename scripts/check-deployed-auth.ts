/** Opt-in smoke check: isolated temporary user, removed in finally. Never logs tokens. */
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { authAdmin, firestore } from "../lib/firebase/admin";
const origin = process.env.SMOKE_ORIGIN;
if (
  !origin ||
  !(origin.startsWith("https://") || origin === "http://127.0.0.1:3100")
)
  throw Error("Set SMOKE_ORIGIN to the authorised HTTPS deployment.");
const auth = authAdmin(),
  uid = `qa-session-${randomUUID()}`;
try {
  await auth.createUser({ uid });
  const token = await auth.createCustomToken(uid);
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, returnSecureToken: true }),
    },
  );
  const signed = await r.json();
  assert.ok(signed.idToken, "Firebase token exchange failed");
  const session = await fetch(`${origin}/api/auth/session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: signed.idToken }),
  });
  console.log("Session:", session.status, session.headers.get("content-type"));
  assert.equal(session.status, 200);
  const cookie = session.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const workspace = await fetch(`${origin}/api/workspace`, {
    headers: { Cookie: cookie },
  });
  assert.equal(workspace.status, 200);
  const state = await workspace.json();
  assert.equal(state.business, null);
  console.log("Authenticated workspace: OK");
  const denied = await fetch(`${origin}/api/workspace`);
  assert.equal(denied.status, 401);
  assert.ok(denied.headers.get("content-type")?.includes("json"));
  console.log("Unauthenticated isolation: OK");
  if (process.env.SMOKE_AI === "1") {
    const demo = await fetch(`${origin}/api/demo`, {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
    });
    const result = await demo.json();
    assert.equal(demo.status, 200, JSON.stringify(result));
    assert.equal(typeof result.reply, "string");
    const updated = await (
      await fetch(`${origin}/api/workspace`, { headers: { Cookie: cookie } })
    ).json();
    assert.ok(updated.usage.total > 0);
    assert.equal(updated.usage.jobs, 1);
    console.log(
      "Live AI and provider token accounting: OK",
      updated.usage.total,
      "tokens",
    );
  }
  if (process.env.SMOKE_AUDIO) {
    const form = new FormData();
    form.set("consent", "true");
    form.set(
      "audio",
      new Blob([await readFile(process.env.SMOKE_AUDIO)], {
        type: "audio/wav",
      }),
      "sample.wav",
    );
    const voice = await fetch(`${origin}/api/voice`, {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
      body: form,
    });
    const output = await voice.json();
    assert.equal(voice.status, 200, JSON.stringify(output));
    assert.match(
      output.transcript,
      new RegExp(process.env.SMOKE_AUDIO_EXPECT || "Brooklyn Bridge", "i"),
    );
    console.log("Voice transcription: OK");
  }
} finally {
  await auth.deleteUser(uid);
  for (const collection of ["ai_usage", "processing_quotas"]) {
    const docs = await firestore()
      .collection(collection)
      .where("user_id", "==", uid)
      .get();
    await Promise.all(docs.docs.map((d) => d.ref.delete()));
  }
  console.log("Temporary test user and records removed.");
}
