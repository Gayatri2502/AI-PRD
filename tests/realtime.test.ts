import test from "node:test";
import assert from "node:assert/strict";
import { realtimeConfig } from "../lib/finance/realtime";
import { voiceActionSchema } from "../lib/finance/voice-actions";

test("voice config enables interruptions and retains confirmed business context", () => {
  const config = realtimeConfig({ name: "Example Services", location: "Pune" }, "Hindi");
  assert.equal(config.type, "realtime");
  assert.equal(config.audio.input.turn_detection.interrupt_response, true);
  assert.ok(config.instructions.includes("Hindi"));
  assert.ok(config.instructions.includes("Example Services"));
  assert.ok(config.instructions.includes("Do not calculate"));
  assert.equal(config.max_output_tokens, 600);
  assert.equal("apiKey" in config, false);
});

test("voice actions reject implicit confirmation, unknown fields and invalid loan values", () => {
  assert.equal(voiceActionSchema.safeParse({ action: "update_business", confirmed: true }).success, false);
  assert.equal(voiceActionSchema.safeParse({ action: "update_business", assumptions: { loan: "-100" } }).success, false);
  assert.equal(voiceActionSchema.safeParse({ action: "update_business", profile: { unknown: "x" } }).success, false);
  assert.equal(voiceActionSchema.safeParse({ action: "generate" }).success, false);
});

test("voice actions preserve explicitly supplied facts without defaulting missing figures", () => {
  const result = voiceActionSchema.parse({ action: "update_business", profile: { name: "Example" }, assumptions: { loan: "100000", tenureMonths: 36 } });
  assert.deepEqual(result, { action: "update_business", profile: { name: "Example" }, assumptions: { loan: "100000", tenureMonths: 36 } });
  assert.equal(voiceActionSchema.safeParse({ action: "report_settings", reportType: "cma", style: "classic", charts: false }).success, true);
});
