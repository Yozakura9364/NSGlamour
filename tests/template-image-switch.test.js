const assert = require("node:assert/strict");

function hasImage(imageData) {
  return Boolean(imageData?.image);
}

function makeSlots(slotIds, existing = {}) {
  return Object.fromEntries(slotIds.map((slotId) => {
    const current = existing[slotId] || {};
    return [slotId, {
      image: current.image || null,
      imageUrl: current.imageUrl || "",
      imageName: current.imageName || "",
    }];
  }));
}

function saveSnapshot(imagesById, templateId, stateImages) {
  imagesById[templateId] = Object.fromEntries(Object.entries(stateImages).map(([slotId, imageData]) => [
    slotId,
    { ...imageData },
  ]));
}

const imagesById = {};
let currentTemplateId = "eorzea";
let stateImages = makeSlots(["main"]);

stateImages.main = { image: {}, imageUrl: "eorzea.png", imageName: "eorzea" };
saveSnapshot(imagesById, currentTemplateId, stateImages);

currentTemplateId = "horizontal";
stateImages = makeSlots(["horizontal-left", "horizontal-right"], imagesById[currentTemplateId] || {});
stateImages["horizontal-left"] = { image: {}, imageUrl: "left.png", imageName: "left" };
stateImages["horizontal-right"] = { image: {}, imageUrl: "right.png", imageName: "right" };
saveSnapshot(imagesById, currentTemplateId, stateImages);

currentTemplateId = "ec";
stateImages = makeSlots(["main"], imagesById[currentTemplateId] || {});
stateImages.main = { image: {}, imageUrl: "ec.png", imageName: "ec" };
saveSnapshot(imagesById, currentTemplateId, stateImages);

assert.equal(hasImage(imagesById.eorzea.main), true);
assert.equal(hasImage(imagesById.horizontal["horizontal-left"]), true);
assert.equal(hasImage(imagesById.horizontal["horizontal-right"]), true);
assert.equal(hasImage(imagesById.ec.main), true);

console.log("template image switch ok");
