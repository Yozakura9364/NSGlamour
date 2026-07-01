const assert = require("node:assert/strict");
const policy = require("../static/template-dye-policy.js");

const forced = policy.resolveDyeOptions({
  includeAccessories: false,
  maxSlots: 2,
  forceSlotCount: 2,
});

assert.equal(policy.getSlotCount({ slot: "Body", item: {} }, forced, 0, false), 2);
assert.equal(policy.getSlotCount({ slot: "Hands", item: {} }, forced, 1, false), 2);
assert.equal(policy.getSlotCount({ slot: "Ears", item: {} }, forced, 2, true), 0);
assert.equal(policy.getSlotCount({ slot: "Glasses", item: {} }, forced, 2, true), 0);
assert.equal(policy.getSlotCount({ slot: "FashionAccessory", item: {} }, forced, 2, true), 0);

const normal = policy.resolveDyeOptions({
  includeAccessories: false,
  maxSlots: 2,
});

assert.equal(policy.getSlotCount({ slot: "Body", item: {} }, normal, 1, false), 1);

console.log("template dye policy ok");
