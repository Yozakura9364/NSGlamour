const assert = require("node:assert/strict");
const layout = require("../static/snapshot-layout.js");

const slotOrder = ["MainHand", "OffHand", "HeadGear", "Body", "Hands", "Legs"];
const entries = [
  { slot: "Body", item: { name: "Body item" } },
  { slot: "MainHand", item: { name: "Weapon" } },
];
const slotNames = Object.fromEntries(slotOrder.map((slot) => [slot, { en: slot }]));

assert.equal(layout.normalizeMode("invalid"), layout.COMPACT_MODE);
assert.equal(layout.normalizeMode(layout.SPACIOUS_MODE), layout.SPACIOUS_MODE);

const compact = layout.buildEntries(entries, slotNames, layout.COMPACT_MODE, slotOrder);
assert.deepEqual(compact.map((entry) => entry.slot), ["MainHand", "Body"]);
assert.deepEqual(layout.splitEntries(compact).map((column) => column.length), [2]);

const spacious = layout.buildEntries(entries, slotNames, layout.SPACIOUS_MODE, slotOrder);
assert.deepEqual(spacious.map((entry) => entry.slot), slotOrder);
assert.equal(spacious[1].item, null);
assert.deepEqual(spacious[1].slot_names, { en: "OffHand" });
assert.deepEqual(layout.splitEntries(spacious).map((column) => column.length), [3, 3]);
assert.equal(entries.length, 2);

console.log("snapshot layout ok");
