(function () {
  "use strict";

  // ============================================================
  // NSGlamourStore — unified state layer
  // ============================================================

  const PREFIX = "nsglamour.store.";
  const listeners = new Map();
  const IMAGE_VALUE_MAX_BYTES = 4 * 1024 * 1024;

  // --- internal helpers ---
  function kvKey(category, id) { return id ? `${PREFIX}${category}:${id}` : `${PREFIX}${category}`; }

  function read(category, id = "") {
    try { return JSON.parse(localStorage.getItem(kvKey(category, id)) || "null"); }
    catch { return null; }
  }

  function estimateStorageBytes(value) {
    try {
      const text = JSON.stringify(value);
      if (typeof Blob === "function") {
        return new Blob([text]).size;
      }
      return text.length * 2;
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }

  function removeCategoryKeys(category, exceptKey = "") {
    const categoryPrefix = kvKey(category);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        key !== exceptKey &&
        (key === categoryPrefix || key.startsWith(`${categoryPrefix}:`))
      ) {
        try { localStorage.removeItem(key); } catch {}
      }
    }
  }

  function write(category, value, id = "") {
    const targetKey = kvKey(category, id);
    if (value === null) { try { localStorage.removeItem(targetKey); } catch {} return; }
    if (value === undefined) { return; }
    try {
      localStorage.setItem(targetKey, JSON.stringify(value));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        console.warn("[Store] QuotaExceededError writing", category, id, "- clearing image cache only");
        if (category !== "settings" && category !== "equipment") {
          removeCategoryKeys("images", targetKey);
        }
        try { localStorage.setItem(targetKey, JSON.stringify(value)); } catch {}
      }
    }
  }

  function emit(category, data) {
    const subs = listeners.get(category);
    if (subs) { for (const fn of subs) fn(data); }
    // also fire wildcard
    const wild = listeners.get("*");
    if (wild) { for (const fn of wild) fn(category, data); }
  }

  // Cross-tab sync
  window.addEventListener("storage", (e) => {
    if (!e.key || !e.key.startsWith(PREFIX)) return;
    const category = e.key.slice(PREFIX.length).split(":")[0];
    let value = null;
    try {
      value = e.newValue ? JSON.parse(e.newValue) : null;
    } catch {
      console.warn("[Store] Ignoring malformed storage payload", e.key);
      return;
    }
    if (category === Settings.key) {
      Settings._value = null;
    }
    emit(category, value);
    emit(`${category}:changed`, value);
  });

  // ============================================================
  // Equipment — the core loadout data
  // ============================================================
  const Equipment = {
    key: "equipment",
    get() { return read(this.key); },
    set(parsed) {
      write(this.key, parsed);
      emit("equipment:changed", parsed);
    },
    clear() { write(this.key, null); emit("equipment:changed", null); },
  };

  function cleanStoreMeta(data) {
    if (!data || typeof data !== "object") return null;
    const { _storeLocale, _storeDisplayName, _storeTimestamp, ...rest } = data;
    return rest;
  }

  function draftToParsedPayload(draft, options = {}) {
    const defaultLocale = NSGlamourCommon.C.DEFAULT_LOCALE;
    const locale = draft?.locale || defaultLocale;
    const getCandidateName = typeof options.getCandidateName === "function"
      ? options.getCandidateName
      : (item) => NSGlamourCommon.resolveLocalized(item?.names, locale) || item?.name || "";
    return {
      file_type: "模板同步",
      source_name: draft?.sourceName || "模板同步",
      source_title: draft?.sourceName || "",
      source_locale: locale,
      default_locale: locale,
      locales: Object.keys(NSGlamourCommon.C.LOCALE_LABELS),
      resolved_equipment: (draft?.entries || []).map((entry) => ({
        slot: entry.slot,
        slot_names: NSGlamourCommon.getSlotNames(entry.slot),
        candidates: [{
          ...entry.item,
          key: entry.item?.key || "",
          name: NSGlamourCommon.cleanDataminingText(entry.item?.name || getCandidateName(entry.item) || ""),
          icon: entry.item?.icon || 0,
          dye_count: entry.item?.dye_count || 0,
          dye_display: entry.item?.dye_display || "",
          dye_display_by_locale: entry.item?.dye_display_by_locale || {},
          dye_entries: entry.item?.dye_entries || [],
        }],
      })),
    };
  }

  const EquipmentSync = {
    makeParsedPayload(parsed, options = {}) {
      return {
        ...(parsed || {}),
        _storeLocale: options.locale || "",
        _storeDisplayName: options.displayName || "",
        _storeTimestamp: Date.now(),
      };
    },

    makeTemplatePayload(options = {}) {
      return {
        _templateDraft: options.draft,
        _templateParsed: options.parsed || undefined,
        _storeLocale: options.locale || "",
        _storeTimestamp: Date.now(),
      };
    },

    isPayload(data) {
      return Boolean(data?._storeTimestamp);
    },

    getLocale(data) {
      return data?._storeLocale || "";
    },

    getDisplayName(data) {
      return data?._storeDisplayName || data?.source_name || "";
    },

    getTemplateSourceParsed(data) {
      if (data?._templateParsed) return data._templateParsed;
      return Array.isArray(data?.resolved_equipment) ? cleanStoreMeta(data) : null;
    },

    getTemplateDraft(data, buildDraftFromParsed) {
      if (data?._templateDraft) return data._templateDraft;
      const parsed = this.getTemplateSourceParsed(data);
      if (!parsed || typeof buildDraftFromParsed !== "function") return null;
      const draft = buildDraftFromParsed(parsed);
      return draft?.entries?.length ? draft : null;
    },

    getParsedPayload(data, options = {}) {
      if (data?._templateParsed) return data._templateParsed;
      if (data?._templateDraft) return draftToParsedPayload(data._templateDraft, options);
      return Array.isArray(data?.resolved_equipment) ? cleanStoreMeta(data) : null;
    },

    draftToParsedPayload,
  };

  // ============================================================
  // Template images — per-template, per-slot
  //   stored as data-url strings (base64 png/jpeg)
  // ============================================================
  const Images = {
    key: "images",
    _all() { return read(this.key) || {}; },   // { templateId: { slotId: dataUrl } }

    get(templateId, slotId) {
      const all = this._all();
      return all[templateId]?.[slotId] || null;
    },

    set(templateId, slotId, dataUrl) {
      const all = this._all();
      if (!all[templateId]) all[templateId] = {};
      all[templateId][slotId] = dataUrl;
      if (estimateStorageBytes(all) > IMAGE_VALUE_MAX_BYTES) {
        console.warn("[Store] Skipping oversized image cache write");
        return false;
      }
      write(this.key, all);
      emit("images:changed", { templateId, slotId, dataUrl });
      return true;
    },

    remove(templateId, slotId) {
      const all = this._all();
      if (all[templateId]) { delete all[templateId][slotId]; }
      write(this.key, all);
      emit("images:changed", { templateId, slotId, dataUrl: null });
    },

    removeAll(templateId) {
      const all = this._all();
      if (all[templateId]) { delete all[templateId]; }
      write(this.key, all);
      emit("images:changed", { templateId, all: true });
    },

    getAll(templateId) {
      const all = this._all();
      return all[templateId] ? { ...all[templateId] } : {};
    },

    /** True if ANY template/images exist (used by carry-over guard) */
    isEmpty() {
      const all = this._all();
      return Object.keys(all).length === 0 || Object.values(all).every((img) => !img || Object.keys(img).length === 0);
    },
  };

  // ============================================================
  // Workspace settings — templateId, topText, locale, etc.
  // ============================================================
  const DefaultSettings = {
    templateId: "eorzea",
    topText: "",
    locales: ["zh"],
    ecSubtitleLeftText: "",
    ecSubtitleSymbolText: "♦",
    ecSubtitleRightText: "",
    dyeFrameMode: "psd",
    ignoreEmperor: true,
    storySwatchColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    locale: "zh",
    copyFormat: "format1",
    customTemplate: "{{#items}}{部位}：{装备}{换行}｜{染色标签}{染色文案}{换行}{{/items}}",
  };

  function mergeDefaults(raw) {
    const base = { ...DefaultSettings };
    if (!raw || typeof raw !== "object") return base;
    if (raw.ecSubtitleLeftText == null && raw.ecSubtitleLeft != null) {
      base.ecSubtitleLeftText = raw.ecSubtitleLeft;
    }
    if (raw.ecSubtitleSymbolText == null && raw.ecSubtitleSymbol != null) {
      base.ecSubtitleSymbolText = raw.ecSubtitleSymbol;
    }
    if (raw.ecSubtitleRightText == null && raw.ecSubtitleRight != null) {
      base.ecSubtitleRightText = raw.ecSubtitleRight;
    }
    for (const key of Object.keys(base)) {
      if (raw[key] != null) base[key] = raw[key];
    }
    return base;
  }

  const Settings = {
    key: "settings",
    _value: null,

    get() {
      if (!this._value) this._value = mergeDefaults(read(this.key));
      return this._value;
    },

    update(partial) {
      this._value = null; // force re-read
      const merged = { ...mergeDefaults(read(this.key)), ...partial };
      write(this.key, merged);
      this._value = merged;
      emit("settings:changed", merged);
    },

    /** Reset completely (e.g. on clear) */
    set(raw) {
      this._value = null;
      const merged = mergeDefaults(raw);
      write(this.key, merged);
      this._value = merged;
      emit("settings:changed", merged);
    },

    clear() {
      write(this.key, null);
      this._value = { ...DefaultSettings };
      emit("settings:changed", null);
    },
  };

  // ============================================================
  // Locale
  // ============================================================
  const Locale = {
    key: "locale",
    get() { return read(this.key) || NSGlamourCommon.C.DEFAULT_LOCALE; },
    set(locale) { write(this.key, locale); emit("locale:changed", locale); },
  };

  // ============================================================
  // Recent loadouts (thin wrapper over common.js localStorage)
  // ============================================================
  const Recent = {
    getAll() { return NSGlamourCommon.readRecentCache(); },
    save(snapshot) {
      const items = this.getAll();
      const idx = items.findIndex((i) => i.sourceName === snapshot.sourceName);
      if (idx >= 0) items.splice(idx, 1);
      items.unshift(snapshot);
      NSGlamourCommon.writeRecentCache(items);
      emit("recent:changed", items);
    },
    remove(id) {
      const items = this.getAll().filter((i) => i.id !== id);
      NSGlamourCommon.writeRecentCache(items);
      emit("recent:changed", items);
    },
    clear() {
      NSGlamourCommon.writeRecentCache([]);
      emit("recent:changed", []);
    },
  };

  // ============================================================
  // Pub/sub
  // ============================================================
  function on(category, fn) {
    if (!listeners.has(category)) listeners.set(category, new Set());
    listeners.get(category).add(fn);
    return function unsubscribe() {
      const set = listeners.get(category);
      if (set) { set.delete(fn); if (!set.size) listeners.delete(category); }
    };
  }

  // ============================================================
  // Exports
  // ============================================================
  const API = {
    equipment: Equipment,
    equipmentSync: EquipmentSync,
    images: Images,
    settings: Settings,
    locale: Locale,
    recent: Recent,
    on,
    emit,
    PREFIX,
  };

  if (typeof window !== "undefined") {
    window.NSGlamourStore = API;
  }
})();
