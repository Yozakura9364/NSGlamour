const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const common = {
  C: {
    DEFAULT_LOCALE: "zh",
    LOCALE_LABELS: { zh: "chs", en: "en" },
  },
  getSlotLabel(slot) {
    return { Body: "身体" }[slot] || slot;
  },
  getSlotNames(slot) {
    return { zh: this.getSlotLabel(slot), en: slot };
  },
  resolveLocalized(names, locale) {
    return names?.[locale] || names?.zh || names?.en || "";
  },
  cleanDataminingText(value) {
    return String(value || "").replace(/<(?:SoftHyphen|Indent)\s*\/>/gi, "");
  },
  readRecentCache() { return []; },
  writeRecentCache() {},
};

const listeners = {};
const storage = {};
const context = {
  window: {
    addEventListener(type, fn) { listeners[type] = fn; },
    NSGlamourCommon: common,
  },
  localStorage: {
    getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
    setItem(key, value) { storage[key] = String(value); },
    removeItem(key) { delete storage[key]; },
    key(index) { return Object.keys(storage)[index] || null; },
    get length() { return Object.keys(storage).length; },
  },
  console,
  NSGlamourCommon: common,
};

vm.runInNewContext(fs.readFileSync("static/store.js", "utf8"), context);

const sync = context.window.NSGlamourStore.equipmentSync;
const draft = {
  sourceName: "模板",
  locale: "zh",
  entries: [{
    slot: "Body",
    item: {
      key: 42,
      names: { zh: "占星长袍", en: "Star Robe" },
      dye_entries: [{ id: 1 }],
    },
  }],
};

const parsedFromDraft = sync.getParsedPayload(sync.makeTemplatePayload({ draft, locale: "zh" }));
assert.equal(parsedFromDraft.source_name, "模板");
assert.equal(parsedFromDraft.resolved_equipment[0].slot, "Body");
assert.equal(parsedFromDraft.resolved_equipment[0].candidates[0].name, "占星长袍");

const parsed = { source_name: "配装", resolved_equipment: [{ slot: "Body", candidates: [{ key: 7 }] }] };
const storePayload = sync.makeParsedPayload(parsed, { locale: "en", displayName: "Display" });
assert.equal(sync.getLocale(storePayload), "en");
assert.equal(sync.getDisplayName(storePayload), "Display");
assert.deepEqual(JSON.parse(JSON.stringify(sync.getParsedPayload(storePayload))), parsed);

assert.equal(sync.getTemplateDraft(sync.makeTemplatePayload({ draft }), () => null), draft);
assert.deepEqual(JSON.parse(JSON.stringify(sync.getTemplateSourceParsed(storePayload))), parsed);

console.log("store equipment sync ok");
