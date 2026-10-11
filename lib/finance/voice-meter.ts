import WebSocket from "ws";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "../firebase/admin";

/** Only provider-side events reach this function; never accept browser token totals. */
async function record(uid: string, callId: string, response: any) {
  const usage = response?.usage;
  if (!response?.id || !usage) return;
  const counts = [usage.input_tokens, usage.output_tokens, usage.total_tokens];
  if (!counts.every(n => Number.isSafeInteger(n) && n >= 0)) throw Error("Invalid voice usage");
  const db = firestore(), day = new Date().toISOString().slice(0, 10);
  const event = db.collection("voice_usage_events").doc(createHash("sha256").update(`${uid}:${callId}:${response.id}`).digest("hex"));
  const total = db.collection("ai_usage").doc(`${uid}_${day}`);
  await db.runTransaction(async tx => {
    if ((await tx.get(event)).exists) return;
    tx.create(event, { user_id: uid, day, response_id: response.id, total: counts[2], expires_at: new Date(Date.now() + 30 * 86400000) });
    tx.set(total, { user_id: uid, day, input: FieldValue.increment(counts[0]), output: FieldValue.increment(counts[1]), total: FieldValue.increment(counts[2]), voice: FieldValue.increment(counts[2]), calls: FieldValue.increment(1) }, { merge: true });
  });
}

/** Bounded server sideband fits the 300s function lifetime; losing metering ends the call. */
export async function attachVoiceMeter(uid: string, callId: string, key: string) {
  const ws = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`, { headers: { Authorization: `Bearer ${key}` }, handshakeTimeout: 10000 });
  let queue = Promise.resolve();
  let end!: () => void;
  const done = new Promise<void>(resolve => { end = resolve; });
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    clearTimeout(timer);
    await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/hangup`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) }).catch(() => undefined);
    ws.close();
    await queue.catch(() => undefined);
    end();
  }
  const timer = setTimeout(() => void close(), 240000);
  ws.on("message", raw => {
    let event; try { event = JSON.parse(raw.toString()); } catch { return; }
    if (event.type === "response.done") {
      queue = queue.then(() => record(uid, callId, event.response));
      void queue.catch(() => void close());
    }
  });
  ws.on("close", () => void close());
  ws.on("error", () => void close());
  try {
    await new Promise<void>((resolve, reject) => { ws.once("open", resolve); ws.once("error", reject); ws.once("close", () => reject(Error("Voice meter closed"))); });
  } catch { await close(); throw Error("Voice metering unavailable"); }
  return { done };
}
