(function () {
  "use strict";

  const DB_NAME = "nsglamour-template-images-v2";
  const STORE_NAME = "images";
  const KEY_SEPARATOR = "::";
  const idb = window.idbKeyval;
  const imageStore = idb?.createStore?.(DB_NAME, STORE_NAME);
  let persistPromise = null;

  function requestPersistence() {
    if (!navigator.storage?.persist) {
      return Promise.resolve(false);
    }
    if (!persistPromise) {
      persistPromise = navigator.storage.persist().catch(() => false);
    }
    return persistPromise;
  }

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

  function isImageDataUrl(value) {
    return typeof value === "string" && value.startsWith("data:image/");
  }

  async function saveSlot({ templateId, slotId, imageName = "", imageUrl = "", sourceUrl = "", sourceName = "", blob = null }) {
    const normalizedTemplateId = String(templateId || "").trim();
    const normalizedSlotId = String(slotId || "").trim();
    if (
      !imageStore ||
      !normalizedTemplateId ||
      !normalizedSlotId ||
      (!isImageDataUrl(imageUrl) && !(blob instanceof Blob))
    ) {
      return false;
    }
    try {
      await requestPersistence();
      await idb.set(makeKey(normalizedTemplateId, normalizedSlotId), {
        imageName: String(imageName || ""),
        imageUrl: isImageDataUrl(imageUrl) ? imageUrl : "",
        sourceUrl: isImageDataUrl(sourceUrl) ? sourceUrl : "",
        sourceName: String(sourceName || ""),
        blob: blob instanceof Blob ? blob : null,
        updatedAt: Date.now(),
      }, imageStore);
      return true;
    } catch {
      return false;
    }
  }

  async function loadTemplate(templateId) {
    const normalizedTemplateId = String(templateId || "").trim();
    if (!imageStore || !normalizedTemplateId) {
      return [];
    }
    try {
      const keys = await idb.keys(imageStore);
      const records = [];
      for (const key of keys) {
        const { templateId: keyTemplateId, slotId } = splitKey(key);
        if (keyTemplateId !== normalizedTemplateId || !slotId) {
          continue;
        }
        const value = await idb.get(key, imageStore);
        if (!value?.imageUrl && !value?.blob) {
          continue;
        }
        records.push({
          templateId: keyTemplateId,
          slotId,
          imageName: value.imageName || "",
          imageUrl: value.imageUrl || "",
          sourceUrl: value.sourceUrl || "",
          sourceName: value.sourceName || "",
          blob: value.blob,
          updatedAt: value.updatedAt || 0,
        });
      }
      records.sort((a, b) => String(a.slotId || "").localeCompare(String(b.slotId || "")));
      return records;
    } catch {
      return [];
    }
  }

  async function deleteSlot(templateId, slotId) {
    const key = makeKey(templateId, slotId);
    if (!imageStore || key === KEY_SEPARATOR) {
      return false;
    }
    try {
      await idb.del(key, imageStore);
      return true;
    } catch {
      return false;
    }
  }

  window.NSGlamourTemplateImageStore = {
    saveSlot,
    loadTemplate,
    deleteSlot,
    requestPersistence,
  };
})();
