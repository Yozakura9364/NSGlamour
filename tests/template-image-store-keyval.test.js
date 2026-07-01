const assert = require("node:assert/strict");

const KEY_SEPARATOR = "::";

function makeKey(templateId, slotId) {
  return `${String(templateId || "").trim()}${KEY_SEPARATOR}${String(slotId || "").trim()}`;
}

function splitKey(key) {
  const index = String(key || "").indexOf(KEY_SEPARATOR);
  if (index < 0) {
    return { templateId: "", slotId: "" };
  }
  return {
    templateId: key.slice(0, index),
    slotId: key.slice(index + KEY_SEPARATOR.length),
  };
}

function keysForTemplate(keys, templateId) {
  return keys
    .map((key) => ({ key, ...splitKey(key) }))
    .filter((entry) => entry.templateId === templateId && entry.slotId)
    .map((entry) => entry.key);
}

function canSaveImageRecord(record) {
  return Boolean(record?.imageUrl?.startsWith("data:image/") || record?.blob);
}

function serializeImageRecord(record) {
  return {
    imageName: String(record.imageName || ""),
    imageUrl: record.imageUrl?.startsWith("data:image/") ? record.imageUrl : "",
    sourceUrl: record.sourceUrl?.startsWith("data:image/") ? record.sourceUrl : "",
    sourceName: String(record.sourceName || ""),
  };
}

assert.equal(makeKey(" eorzea ", " main "), "eorzea::main");
assert.deepEqual(splitKey("horizontal::horizontal-left"), {
  templateId: "horizontal",
  slotId: "horizontal-left",
});
assert.deepEqual(keysForTemplate(["eorzea::main", "ec::main"], "ec"), ["ec::main"]);
assert.equal(canSaveImageRecord({ imageUrl: "data:image/png;base64,ok" }), true);
assert.equal(canSaveImageRecord({ imageUrl: "" }), false);
assert.deepEqual(serializeImageRecord({
  imageName: "crop",
  imageUrl: "data:image/png;base64,crop",
  sourceUrl: "data:image/jpeg;base64,source",
  sourceName: "source",
}), {
  imageName: "crop",
  imageUrl: "data:image/png;base64,crop",
  sourceUrl: "data:image/jpeg;base64,source",
  sourceName: "source",
});

console.log("template image keyval ok");
