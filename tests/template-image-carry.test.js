const assert = require("node:assert/strict");

function hasTemplateImage(imageData) {
  return Boolean(imageData?.image);
}

function carryTemplateImagesIntoSlots(slotIds, currentImages = {}, sourceImages = {}) {
  const nextImages = Object.fromEntries(slotIds.map((slotId) => {
    const current = currentImages[slotId] || {};
    return [slotId, {
      image: current.image || null,
      imageUrl: current.imageUrl || "",
      imageName: current.imageName || "",
    }];
  }));
  let changed = false;
  slotIds.forEach((slotId) => {
    if (hasTemplateImage(nextImages[slotId])) return;
    const sourceImage = sourceImages[slotId];
    if (!hasTemplateImage(sourceImage)) return;
    nextImages[slotId] = {
      image: sourceImage.image,
      imageUrl: sourceImage.imageUrl || "",
      imageName: sourceImage.imageName || "",
      sourceUrl: sourceImage.sourceUrl || "",
      sourceName: sourceImage.sourceName || "",
    };
    changed = true;
  });
  return { images: nextImages, changed };
}

function carriedSourceUrl(sourceImage) {
  return sourceImage.sourceUrl || sourceImage.imageUrl || "";
}

const carried = carryTemplateImagesIntoSlots(
  ["story-left", "story-right"],
  {},
  { main: { image: {}, imageUrl: "main.png", imageName: "main" } },
);

assert.equal(carried.images["story-left"].image, null);
assert.equal(carried.images["story-right"].image, null);
assert.equal(carried.changed, false);

const sameSlot = carryTemplateImagesIntoSlots(
  ["main"],
  {},
  { main: { image: {}, imageUrl: "crop.png", imageName: "main", sourceUrl: "source.png", sourceName: "source" } },
);

assert.equal(sameSlot.images.main.imageUrl, "crop.png");
assert.equal(carriedSourceUrl(sameSlot.images.main), "source.png");
assert.equal(sameSlot.changed, true);

console.log("template image carry ok");
