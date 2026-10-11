import { test } from "node:test";
import assert from "node:assert/strict";
import { readJSON } from "../lib/http";
test("HTML proxy errors become actionable messages, never JSON syntax errors", async () => {
  await assert.rejects(
    readJSON(
      new Response("<!DOCTYPE html><html>Failure</html>", {
        status: 500,
        headers: { "content-type": "text/html" },
      }),
    ),
    /temporarily unavailable/,
  );
});
test("expired sessions and malformed JSON are handled safely", async () => {
  await assert.rejects(
    readJSON(Response.json({ error: "internal" }, { status: 401 })),
    /session has expired/,
  );
  await assert.rejects(
    readJSON(
      new Response("{", { headers: { "content-type": "application/json" } }),
    ),
    /unreadable response/,
  );
  assert.deepEqual(await readJSON(Response.json({ ok: true })), { ok: true });
});
import { sameOrigin } from "../lib/origin";
test("origin checks use public Host while rejecting cross-site requests", () => {
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3100/api", {
        headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("https://internal/api", {
        headers: { host: "folio.example", origin: "https://evil.example" },
      }),
    ),
    false,
  );
  assert.equal(sameOrigin(new Request("https://folio.example/api")), false);
});
