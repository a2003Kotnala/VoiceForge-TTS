import assert from "node:assert/strict";

import { formatLanguageLabel, getCharacterState } from "../src/lib/utils.ts";

assert.equal(getCharacterState(50, 100), "normal");
assert.equal(getCharacterState(90, 100), "warning");
assert.equal(getCharacterState(101, 100), "error");
assert.match(formatLanguageLabel("en-US"), /English/);

console.log("PASS frontend utils");
