const assert = require("node:assert/strict");

function shouldPersistImage(imageData) {
  return Boolean(imageData?.image && imageData?.imageUrl && !imageData.backupOnly);
}

function shouldRestoreOriginal(record, currentImage) {
  return Boolean(record?.slotId && record.blob && (!currentImage?.image || currentImage.backupOnly));
}

function replacePersistedSlot(events) {
  events.push("write-session-v2");
  events.push("remove-session-v1");
  events.push("delete-indexeddb");
  events.push("save-new");
}

function shouldRestoreSessionBackup(imageData, currentImage) {
  return Boolean(imageData?.imageUrl?.startsWith("data:image/") && !currentImage?.image);
}

assert.equal(shouldPersistImage({ image: {}, imageUrl: "data:image/jpeg;base64,small", backupOnly: true }), false);
assert.equal(shouldPersistImage({ image: {}, imageUrl: "blob:original", backupOnly: false }), true);
assert.equal(shouldRestoreOriginal({ slotId: "main", blob: {} }, { image: {}, backupOnly: true }), true);
assert.equal(shouldRestoreOriginal({ slotId: "main", blob: {} }, { image: {}, backupOnly: false }), false);

const events = [];
replacePersistedSlot(events);
assert.deepEqual(events, ["write-session-v2", "remove-session-v1", "delete-indexeddb", "save-new"]);
assert.equal(shouldRestoreSessionBackup({ imageUrl: "data:image/png;base64,ok" }, { image: null }), true);
assert.equal(shouldRestoreSessionBackup({ imageUrl: "data:image/png;base64,ok" }, { image: {} }), false);

console.log("template image backup quality ok");
