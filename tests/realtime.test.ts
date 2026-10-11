import test from "node:test";
import assert from "node:assert/strict";
import { realtimeConfig } from "../lib/finance/realtime";

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
