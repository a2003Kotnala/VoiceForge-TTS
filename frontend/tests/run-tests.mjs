import assert from "node:assert/strict";

import {
  estimateDuration,
  formatEmotionLabel,
  formatDuration,
  formatLanguageLabel,
  getCharacterState,
  sanitizeTextInput
} from "../src/lib/utils.ts";

assert.equal(getCharacterState(50, 100), "normal");
assert.equal(getCharacterState(90, 100), "warning");
assert.equal(getCharacterState(101, 100), "error");
assert.equal(sanitizeTextInput(" Hello   there \n\n\nfriend "), "Hello there \n\nfriend");
assert.equal(formatEmotionLabel("storytelling"), "Storytelling");
assert.equal(formatDuration(125), "2:05");
assert.ok(estimateDuration("one two three four five", 1) > 0);
assert.match(formatLanguageLabel("en-US"), /English/);

console.log("PASS frontend utils");
