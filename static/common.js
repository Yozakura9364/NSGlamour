(function () {
  "use strict";

  // ============================================================
  // Constants
  // ============================================================
  const C = {
    THEME_KEY: "nsglamour.theme",
    THEME_MESSAGE_TYPE: "nsglamour:theme",
    CARD_DRAFT_KEY: "nsglamour.cardDraft.v2",
    RECENT_CACHE_KEY: "nsglamour.recentLoadouts",
    RECENT_CACHE_LIMIT: 10,
    DEFAULT_LOCALE: "zh",
    LOCALE_LABELS: { zh: "chs", en: "en", ja: "ja", ko: "ko", tc: "tc", fr: "fr", de: "de" },
    SLOT_DEFINITIONS: [
      { key: "MainHand", label: "主手", names: { zh: "主手", en: "Main Hand", ja: "メインアーム", ko: "주 무기", tc: "主手", fr: "Main directrice", de: "Haupthand" } },
      { key: "OffHand", label: "副手", names: { zh: "副手", en: "Off Hand", ja: "サブアーム", ko: "보조 무기", tc: "副手", fr: "Main non directrice", de: "Nebenhand" } },
      { key: "HeadGear", label: "头部", names: { zh: "头部", en: "Head", ja: "頭", ko: "머리", tc: "頭部", fr: "Tête", de: "Kopf" } },
      { key: "Body", label: "身体", names: { zh: "身体", en: "Body", ja: "胴", ko: "몸통", tc: "身體", fr: "Torse", de: "Rumpf" } },
      { key: "Hands", label: "手臂", names: { zh: "手臂", en: "Hands", ja: "手", ko: "손", tc: "手臂", fr: "Mains", de: "Hände" } },
      { key: "Legs", label: "腿部", names: { zh: "腿部", en: "Legs", ja: "脚", ko: "다리", tc: "腿部", fr: "Jambes", de: "Beine" } },
      { key: "Feet", label: "脚部", names: { zh: "脚部", en: "Feet", ja: "足", ko: "발", tc: "腳部", fr: "Pieds", de: "Füße" } },
      { key: "Ears", label: "耳部", names: { zh: "耳部", en: "Ears", ja: "耳", ko: "귀", tc: "耳部", fr: "Oreilles", de: "Ohren" } },
      { key: "Neck", label: "颈部", names: { zh: "颈部", en: "Neck", ja: "首", ko: "목", tc: "頸部", fr: "Cou", de: "Hals" } },
      { key: "Wrists", label: "腕部", names: { zh: "腕部", en: "Wrists", ja: "腕", ko: "손목", tc: "腕部", fr: "Poignets", de: "Handgelenke" } },
      { key: "LeftRing", label: "左指", names: { zh: "左指", en: "Left Ring", ja: "左指", ko: "왼쪽 손가락", tc: "左指", fr: "Bague gauche", de: "Finger (links)" } },
      { key: "RightRing", label: "右指", names: { zh: "右指", en: "Right Ring", ja: "右指", ko: "오른쪽 손가락", tc: "右指", fr: "Bague droite", de: "Finger (rechts)" } },
      { key: "Glasses", label: "面部配饰", names: { zh: "面部配饰", en: "Facewear", ja: "フェイスアクセサリー", ko: "얼굴 소품", tc: "臉部配件", fr: "Accessoires de visage", de: "Gesichtsaccessoires" } },
      { key: "FashionAccessory", label: "时尚配饰", names: { zh: "时尚配饰", en: "Fashion Accessory", ja: "FASHION ACCESSORIES", ko: "패션 소품", tc: "時尚配件", fr: "Accessoires de mode", de: "MODEACCESSOIRES" } },
    ],
    ACCESSORY_SLOTS: new Set(["Ears", "Neck", "Wrists", "LeftRing", "RightRing", "Glasses", "FashionAccessory"]),
    WEAPON_SLOTS: new Set(["MainHand", "OffHand"]),
    ARMOR_SLOTS: new Set(["HeadGear", "Body", "Hands", "Legs", "Feet"]),
  };

  // ============================================================
  // Path utilities
  // ============================================================
  let _appBasePath = null;

  function getAppBasePath() {
    if (_appBasePath !== null) return _appBasePath;
    const scriptUrl = document.currentScript?.src || "";
    if (!scriptUrl) { _appBasePath = ""; return ""; }
    try {
      const pathname = new URL(scriptUrl).pathname;
      const staticIndex = pathname.indexOf("/static/");
      _appBasePath = staticIndex > 0 ? pathname.slice(0, staticIndex) : "";
    } catch { _appBasePath = ""; }
    return _appBasePath;
  }

  function appPath(path) {
    const normalized = String(path || "").startsWith("/") ? String(path) : `/${path}`;
    return `${getAppBasePath()}${normalized}`;
  }

  // ============================================================
  // Theme
  // ============================================================
  function getThemeIcons() {
    return {
      dark: appPath("/static/icons/sun.svg"),
      light: appPath("/static/icons/moon.svg"),
    };
  }

  function applyTheme(theme, options = {}) {
    const normalized = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", normalized);
    const icon = document.getElementById("themeToggleIcon");
    const btn = document.getElementById("themeToggleBtn");
    if (icon) icon.src = getThemeIcons()[normalized];
    if (btn) {
      const title = normalized === "dark" ? "切换为白昼" : "切换为黑夜";
      btn.title = title;
      btn.setAttribute("aria-label", title);
    }
    if (options.notifyParent !== false && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: C.THEME_MESSAGE_TYPE, theme: normalized }, window.location.origin);
    }
  }

  function loadTheme() {
    applyTheme(localStorage.getItem(C.THEME_KEY) === "dark" ? "dark" : "light", { notifyParent: false });
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(C.THEME_KEY, next);
    applyTheme(next);
  }

  function setupThemeListeners() {
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === C.THEME_MESSAGE_TYPE) {
        const theme = event.data?.theme === "dark" ? "dark" : "light";
        localStorage.setItem(C.THEME_KEY, theme);
        applyTheme(theme, { notifyParent: false });
      }
    });
    window.addEventListener("storage", (event) => {
      if (event.key === C.THEME_KEY) {
        applyTheme(event.newValue === "dark" ? "dark" : "light", { notifyParent: false });
      }
    });
  }

  // ============================================================
  // Localization helpers (pure, no side effects)
  // ============================================================
  function resolveLocalized(map, locale) {
    if (!map || typeof map !== "object") return "";
    return cleanDataminingText(map[locale] || map.zh || map.en || Object.values(map).find(Boolean) || "");
  }

  function cleanDataminingText(value) {
    return String(value || "").replace(/<(?:SoftHyphen|Indent)\s*\/>/gi, "");
  }

  function localeToHtmlLang(locale) {
    const map = { zh: "zh-CN", tc: "zh-TW", en: "en", ja: "ja", ko: "ko", fr: "fr", de: "de" };
    return map[locale] || locale || "zh-CN";
  }

  function getSlotLabel(slotKey) {
    const def = C.SLOT_DEFINITIONS.find((s) => s.key === slotKey);
    return def?.label || slotKey || "";
  }

  function getSlotNames(slotKey) {
    const def = getSlotDefinition(slotKey);
    return def?.names ? { ...def.names } : { [C.DEFAULT_LOCALE]: getSlotLabel(slotKey) };
  }

  function getSlotDefinition(slotKey) {
    return C.SLOT_DEFINITIONS.find((s) => s.key === slotKey) || null;
  }

  // ============================================================
  // Network
  // ============================================================
  async function readJsonResponse(response) {
    try {
      return await response.json();
    } catch (error) {
      if (response.ok) {
        throw new Error("服务器返回了无法解析的数据");
      }
      return {};
    }
  }

  async function fetchJson(path, options = {}) {
    const response = await fetch(appPath(path), { cache: "no-store", ...options });
    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  // ============================================================
  // Icon
  // ============================================================
  function buildIconUrl(iconId) {
    const numericId = Number(iconId);
    if (!Number.isFinite(numericId) || numericId <= 0) return "";
    return appPath(`/api/icon/${numericId}`);
  }

  // ============================================================
  // Stain data layer (requires a stainsByLocale object passed in)
  // ============================================================
  const pendingStainRequests = new WeakMap();

  function makeStainsApi() {
    return {
      async ensureStains(stainsByLocale, locale) {
        if (!stainsByLocale || typeof stainsByLocale !== "object") return;
        if (stainsByLocale[locale]) return;
        let pendingByLocale = pendingStainRequests.get(stainsByLocale);
        if (!pendingByLocale) {
          pendingByLocale = new Map();
          pendingStainRequests.set(stainsByLocale, pendingByLocale);
        }
        if (!pendingByLocale.has(locale)) {
          pendingByLocale.set(locale, (async () => {
            const response = await fetch(appPath(`/api/stains?${new URLSearchParams({ locale }).toString()}`), { cache: "no-store" });
            const data = await readJsonResponse(response);
            if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
            stainsByLocale[locale] = Array.isArray(data.results) ? data.results : [];
          })().finally(() => pendingByLocale.delete(locale)));
        }
        return pendingByLocale.get(locale);
      },

      getStainById(stainsByLocale, stainId, locale) {
        const stains = stainsByLocale[locale] || stainsByLocale[C.DEFAULT_LOCALE] || [];
        return stains.find((s) => Number(s.id) === Number(stainId)) || null;
      },

      getStainName(stainsByLocale, stainId, locale) {
        return cleanDataminingText(this.getStainById(stainsByLocale, stainId, locale)?.name || "");
      },

      localizeDyeEntry(stainsByLocale, entry, locale) {
        if (!entry) return entry;
        const stain = Number(entry.id) > 0 ? this.getStainById(stainsByLocale, entry.id, locale) : null;
        if (!stain?.name) return entry;
        return {
          ...entry,
          name: cleanDataminingText(entry.name || stain.name),
          names: { ...(entry.names || {}), [locale]: cleanDataminingText(stain.name) },
          hex: entry.hex || stain.hex,
          rgb: entry.rgb ?? stain.rgb,
          group: entry.group ?? stain.group,
          group_name: entry.group_name || stain.group_name,
          sub_order: entry.sub_order ?? stain.sub_order,
        };
      },

      findStainByName(stainsByLocale, name, locale) {
        const normalized = cleanDataminingText(name).trim();
        if (!normalized) return null;
        const stains = [
          ...(stainsByLocale[locale] || []),
          ...(stainsByLocale[C.DEFAULT_LOCALE] || []),
        ];
        return stains.find((s) => cleanDataminingText(s.name) === normalized) || null;
      },
    };
  }

  const Stains = makeStainsApi();

  // ============================================================
  // Dye utilities
  // ============================================================
  function makeNoDyeEntry(noDyeLabels) {
    return {
      id: 0,
      name: resolveLocalized(noDyeLabels || {}, C.DEFAULT_LOCALE) || "无染色",
      names: noDyeLabels || {},
      hex: "transparent",
      isEmpty: true,
    };
  }

  function updateDyeDisplay(candidate, stainsByLocale, locale) {
    if (!candidate) return;
    const entries = Array.isArray(candidate.dye_entries) ? candidate.dye_entries : [];
    candidate.dye_display = entries
      .map((e) => cleanDataminingText(Stains.getStainName(stainsByLocale, e.id, locale) || e.name || ""))
      .join(" | ");
    candidate.dye_display_by_locale = { ...candidate.dye_display_by_locale, [locale]: candidate.dye_display };
  }

  function normalizeDyeEntries(opts = {}) {
    const { candidate, slot, stainsByLocale, locale, sourceDyeEntries, noDyeLabels } = opts;
    const dyeCount = Math.max(0, Math.min(Number(opts.dyeCount ?? candidate?.dye_count ?? 0), 2));
    if (dyeCount <= 0) return [];
    const display = resolveLocalized(candidate?.dye_display_by_locale, locale) || candidate?.dye_display || "";
    const displayParts = display.split("|").map((p) => p.trim()).filter(Boolean);
    const prev = Array.isArray(sourceDyeEntries) ? sourceDyeEntries : candidate?.dye_entries;
    const entries = Array.isArray(prev)
      ? prev.slice(0, dyeCount).map((entry) => Stains.localizeDyeEntry(stainsByLocale, entry, locale))
      : [];

    if (!entries.length && displayParts.length) {
      for (const part of displayParts.slice(0, dyeCount)) {
        const stain = Stains.findStainByName(stainsByLocale, part, locale) || { id: 0, name: part, hex: "#000000", rgb: 0 };
        const stainName = cleanDataminingText(stain.name || part);
        entries.push({ id: stain.id, names: { [locale]: stainName }, name: stainName, hex: stain.hex, rgb: stain.rgb });
      }
    }
    while (entries.length < dyeCount) entries.push(makeNoDyeEntry(noDyeLabels));
    for (let i = 0; i < entries.length; i++) { if (!entries[i]) entries[i] = makeNoDyeEntry(noDyeLabels); }
    return entries;
  }

  function getCandidateDyeCount(candidate, slot) {
    if (!candidate || C.ACCESSORY_SLOTS.has(slot)) return 0;
    return Math.max(0, Math.min(Number(candidate.dye_count || 0), 2));
  }

  function getDisplayDyeEntries(candidate, slot, noDyeLabels) {
    const dyeCount = getCandidateDyeCount(candidate, slot);
    const entries = (Array.isArray(candidate?.dye_entries) ? candidate.dye_entries : []).slice(0, dyeCount);
    while (entries.length < dyeCount) entries.push(makeNoDyeEntry(noDyeLabels));
    return entries.map((e) => e || makeNoDyeEntry(noDyeLabels));
  }

  function getDyeEntryName(entry, noDyeLabels, locale) {
    if (entry?.isEmpty || Number(entry?.id) === 0) return resolveLocalized(noDyeLabels || {}, locale) || "无染色";
    return cleanDataminingText(resolveLocalized(entry?.names, locale) || entry?.name || "");
  }

  // ============================================================
  // Dye grouping / search (pure, no side effects)
  // ============================================================
  function groupStains(stains) {
    const groups = new Map();
    for (const stain of stains) {
      const key = String(stain.group || 0);
      if (!groups.has(key)) {
        groups.set(key, { key, order: Number(stain.group || 0), label: stain.group_name || (stain.group ? `分组 ${stain.group}` : "其他"), items: [] });
      }
      groups.get(key).items.push(stain);
    }
    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }

  function normalizeDyeSearchText(value) { return String(value || "").trim().toLowerCase(); }

  function stainMatchesQuery(stain, query) {
    const q = normalizeDyeSearchText(query);
    if (!q) return true;
    const fields = [stain.id, stain.name, stain.hex, stain.group_name, stain.group, ...(stain.names && typeof stain.names === "object" ? Object.values(stain.names) : [])];
    return fields.some((f) => normalizeDyeSearchText(f).includes(q));
  }

  // ============================================================
  // Recent cache (localStorage, no page-specific state)
  // ============================================================
  function readRecentCache() {
    try { const data = JSON.parse(localStorage.getItem(C.RECENT_CACHE_KEY) || "[]"); return Array.isArray(data) ? data : []; }
    catch { return []; }
  }

  function writeRecentCache(items) {
    localStorage.setItem(C.RECENT_CACHE_KEY, JSON.stringify((Array.isArray(items) ? items : []).slice(0, C.RECENT_CACHE_LIMIT)));
  }

  function formatRecentTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  // ============================================================
  // Draft (localStorage, no page-specific state)
  // ============================================================
  function writeCurrentDraft(draft) {
    if (!draft || !Array.isArray(draft.entries) || !draft.entries.length) { localStorage.removeItem(C.CARD_DRAFT_KEY); return; }
    localStorage.setItem(C.CARD_DRAFT_KEY, JSON.stringify(draft));
  }

  function buildDraftFromParsedPayload(parsed, options = {}) {
    const { stainsByLocale = {}, localeOrder = [] } = options;
    const locale = parsed?.source_locale || parsed?.default_locale || C.DEFAULT_LOCALE;
    const slotDefs = C.SLOT_DEFINITIONS;
    const entriesMap = new Map();
    if (Array.isArray(parsed?.resolved_equipment)) {
      for (const entry of parsed.resolved_equipment) { if (entry?.slot) entriesMap.set(entry.slot, entry); }
    }
    const visible = slotDefs.map((s) => entriesMap.get(s.key) || { slot: s.key, __emptySlot: true });
    const filled = visible.filter((e) => {
      const c = Array.isArray(e.candidates) ? e.candidates[0] : null;
      return e?.slot && c && !e.__emptySlot;
    });
    const noDyeLabels = parsed?.no_dye_labels || {};
    const entries = filled.map((entry) => {
      const c = Array.isArray(entry.candidates) ? entry.candidates[0] : null;
      if (!c) return null;
      const dc = getCandidateDyeCount(c, entry.slot);
      return {
        slot: entry.slot,
        item: {
          ...c,
          name: cleanDataminingText(c.name || resolveLocalized(c.names, locale) || ""),
          dye_count: dc,
          dye_display: dc > 0 ? cleanDataminingText(resolveLocalized(c.dye_display_by_locale, locale) || c.dye_display || "") : "",
          dye_display_by_locale: c.dye_display_by_locale || {},
          dye_entries: getDisplayDyeEntries(c, entry.slot, noDyeLabels),
        },
      };
    }).filter(Boolean);
    return { version: 1, sourceName: "手动编辑", locale, createdAt: new Date().toISOString(), entries };
  }

  // ============================================================
  // Dye picker UI (heavy DOM, parameterized by caller)
  // ============================================================
  function renderDyePickerOptions(panel, stains, query, callbacks) {
    const results = stains.filter((s) => stainMatchesQuery(s, query));
    const list = panel.querySelector(".dye-picker-results");
    if (!list) return;
    list.innerHTML = "";
    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "dye-picker-empty";
      empty.textContent = "没有匹配的染剂";
      list.appendChild(empty);
      window.NSGlamourUiLanguage?.refresh?.(list);
      return;
    }
    for (const group of groupStains(results)) {
      const title = document.createElement("div");
      title.className = "dye-picker-group-title";
      title.textContent = group.label;
      list.appendChild(title);
      for (const stain of group.items) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "dye-picker-option";
        option.style.setProperty("--dye-color", stain.hex || "#000000");
        const swatch = document.createElement("span");
        swatch.className = "dye-picker-swatch";
        option.appendChild(swatch);
        const name = document.createElement("span");
        name.textContent = stain.name;
        option.appendChild(name);
        option.addEventListener("click", (event) => {
          event.stopPropagation();
          if (callbacks?.onSelect) callbacks.onSelect(stain);
        });
        list.appendChild(option);
      }
    }
    window.NSGlamourUiLanguage?.refresh?.(list);
  }

  function openDyePicker(button, stains, callbacks) {
    closeAllDyePickers();
    const panel = document.createElement("div");
    panel.className = "dye-picker-panel";
    panel.addEventListener("click", (e) => e.stopPropagation());
    const search = document.createElement("input");
    search.className = "dye-picker-search";
    search.type = "search";
    search.placeholder = "搜索染剂";
    search.spellcheck = false;
    search.autocomplete = "off";
    search.addEventListener("input", () => renderDyePickerOptions(panel, stains, search.value, callbacks));
    panel.appendChild(search);
    const results = document.createElement("div");
    results.className = "dye-picker-results";
    panel.appendChild(results);
    renderDyePickerOptions(panel, stains, "", callbacks);
    const host = button.closest(".editor-dye-select");
    if (!host) {
      return;
    }
    host.appendChild(panel);
    search.focus({ preventScroll: true });
  }

  function closeAllDyePickers() {
    document.querySelectorAll(".dye-picker-panel").forEach((p) => p.remove());
  }

  // ============================================================
  // Recent panel UI
  // ============================================================
  function renderRecentList(container, callbacks) {
    if (!container) return;
    const items = readRecentCache();
    container.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "recent-empty";
      empty.textContent = "暂无缓存";
      container.appendChild(empty);
      return;
    }
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "recent-item-row";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-item";
      button.addEventListener("click", () => callbacks?.onRestore?.(item));
      const name = document.createElement("strong");
      name.textContent = item.displayName || "未命名";
      button.appendChild(name);
      const meta = document.createElement("span");
      const count = Array.isArray(item.parsed?.resolved_equipment) ? item.parsed.resolved_equipment.length : 0;
      meta.textContent = `${count} 个部位 · ${formatRecentTime(item.savedAt)}`;
      button.appendChild(meta);
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "recent-delete";
      delBtn.title = "删除这条记录";
      delBtn.setAttribute("aria-label", `删除 ${item.displayName || "最近装备"}`);
      delBtn.textContent = "×";
      delBtn.addEventListener("click", (e) => { e.stopPropagation(); callbacks?.onDelete?.(item.id); });
      row.append(button, delBtn);
      container.appendChild(row);
    }
  }

  // ============================================================
  // Exports
  // ============================================================
  const API = {
    C,
    getAppBasePath,
    appPath,
    applyTheme,
    loadTheme,
    toggleTheme,
    setupThemeListeners,
    resolveLocalized,
    localeToHtmlLang,
    getSlotLabel,
    getSlotNames,
    getSlotDefinition,
    fetchJson,
    buildIconUrl,
    Stains,
    makeNoDyeEntry,
    updateDyeDisplay,
    normalizeDyeEntries,
    getCandidateDyeCount,
    getDisplayDyeEntries,
    getDyeEntryName,
    cleanDataminingText,
    groupStains,
    normalizeDyeSearchText,
    stainMatchesQuery,
    readRecentCache,
    writeRecentCache,
    formatRecentTime,
    writeCurrentDraft,
    buildDraftFromParsedPayload,
    renderDyePickerOptions,
    openDyePicker,
    closeAllDyePickers,
    renderRecentList,
  };

  if (typeof window !== "undefined") {
    window.NSGlamourCommon = API;
  }
})();
