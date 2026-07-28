const urlInput = document.getElementById("equipinfoUrlInput");
const linkForm = document.getElementById("equipinfoLinkForm");
const linkInputWrap = document.querySelector(".equipinfo-link-input-wrap");
const charaDropOverlay = document.getElementById("equipinfoCharaDropOverlay");
const textForm = document.getElementById("equipinfoTextForm");
const textInput = document.getElementById("equipinfoTextInput");
const textInputWrap = document.querySelector(".equipinfo-code-input");
const charaDropHost = linkForm || textForm;
const charaDropTarget = linkInputWrap || textInputWrap;
const textLineNumbers = document.getElementById("equipinfoTextLineNumbers");
const sourceLocaleSelect = document.getElementById("equipinfoSourceLocaleSelect");
const clearButton = document.getElementById("equipinfoClearButton");
const statusText = document.getElementById("equipinfoStatus");
const resultSection = document.getElementById("equipinfoResultSection");
const copySection = document.getElementById("equipinfoCopySection");
const sourceName = document.getElementById("equipinfoSourceName");
const metaText = document.getElementById("equipinfoMeta");
const languageControls = document.getElementById("equipinfoLanguageControls");
const slotGrid = document.getElementById("equipinfoSlotGrid");
const slotTemplate = document.getElementById("equipinfoSlotTemplate");
const copyOutput = document.getElementById("equipinfoCopyOutput");
// openTemplateButton removed — pages sync automatically via NSGlamourStore
const warningsBox = document.getElementById("equipinfoWarnings");
const copyFormatControls = document.getElementById("equipinfoCopyFormatControls");
const customTemplatePanel = document.getElementById("equipinfoCustomTemplatePanel");
const customTemplateInput = document.getElementById("equipinfoCustomTemplateInput");
const resetTemplateButton = document.getElementById("equipinfoResetTemplateButton");
const tokenChips = Array.from(document.querySelectorAll("#equipinfoTemplateReference .token-chip"));
const saveConfigButton = document.getElementById("equipinfoSaveConfigButton");
const recentButton = document.getElementById("equipinfoRecentButton");
const recentPanel = document.getElementById("equipinfoRecentPanel");
const recentList = document.getElementById("equipinfoRecentList");
const clearRecentButton = document.getElementById("equipinfoClearRecentButton");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleIcon = document.getElementById("themeToggleIcon");

const THEME_KEY = NSGlamourCommon.C.THEME_KEY;
const THEME_MESSAGE_TYPE = NSGlamourCommon.C.THEME_MESSAGE_TYPE;
const CARD_DRAFT_KEY = NSGlamourCommon.C.CARD_DRAFT_KEY;
const RECENT_CACHE_KEY = NSGlamourCommon.C.RECENT_CACHE_KEY;
const RECENT_CACHE_LIMIT = NSGlamourCommon.C.RECENT_CACHE_LIMIT;
const CUSTOM_TEMPLATE_KEY = "nsglamour.copyTemplate";
const COPY_FORMAT_KEY = "nsglamour.copyFormat";
const DEFAULT_LOCALE = NSGlamourCommon.C.DEFAULT_LOCALE;
const LOCALE_ORDER = ["zh", "en", "ja", "ko", "tc", "fr", "de"];
const UI_LANGUAGE_TO_EQUIPINFO_LOCALE = {
  "zh-CN": "zh",
  "zh-TW": "tc",
  en: "en",
  ja: "ja",
  ko: "ko",
  fr: "fr",
  de: "de",
};
const LOCALE_LABELS = NSGlamourCommon.C.LOCALE_LABELS;
const SLOT_DEFINITIONS = NSGlamourCommon.C.SLOT_DEFINITIONS;
const EQUIPINFO_LEFT_COLUMN_SLOTS = ["MainHand", "HeadGear", "Body", "Hands", "Legs", "Feet", "Glasses"];
const EQUIPINFO_RIGHT_COLUMN_SLOTS = ["OffHand", "Ears", "Neck", "Wrists", "LeftRing", "RightRing", "FashionAccessory"];
const ACCESSORY_SLOTS = NSGlamourCommon.C.ACCESSORY_SLOTS;
const CUSTOM_TEMPLATE_DEFAULT = "{{#items}}{部位}：{装备}{换行}{{#染色文案}}｜{染色标签}{染色文案}{换行}{{/染色文案}}{{/items}}";
const COPY_FORMATS = new Set(["format1", "format2", "format3", "format4", "custom"]);
const APP_CONFIG = window.NSGLAMOUR_CONFIG || {};
const CHARA_IMPORT_ENABLED = APP_CONFIG.charaImportEnabled === true;
const MAX_UPLOAD_BYTES = Number(APP_CONFIG.maxUploadBytes) || 5 * 1024 * 1024;

const state = {
  parsed: null,
  locale: DEFAULT_LOCALE,
  copyFormat: "format1",
  customTemplate: CUSTOM_TEMPLATE_DEFAULT,
  stainsByLocale: {},
  displayName: "",
};
let _storeIgnoreSync = false;
let equipinfoInitialized = false;

function createEmptyParsedPayload() {
  return {
    file_type: "手动编辑",
    source_name: "装备信息",
    source_title: "装备信息",
    source_locale: DEFAULT_LOCALE,
    default_locale: DEFAULT_LOCALE,
    locales: LOCALE_ORDER.slice(),
    locale_labels: { ...LOCALE_LABELS },
    dye_labels: { zh: "染色：", tc: "染色：", en: "Dye: ", ja: "染色：", ko: "염색: ", fr: "Teinture : ", de: "Farbe: " },
    no_dye_labels: { zh: "无染色", tc: "無染色", en: "No Dye", ja: "染色なし", ko: "염색 없음", fr: "Sans teinture", de: "Keine Farbe" },
    slot_names: Object.fromEntries(SLOT_DEFINITIONS.map((slot) => [slot.key, NSGlamourCommon.getSlotNames(slot.key)])),
    warnings: [],
    resolved_equipment: [],
  };
}

function getAppBasePath() { return NSGlamourCommon.getAppBasePath(); }
function appPath(path) { return NSGlamourCommon.appPath(path); }

function applyTheme(theme, options = {}) { return NSGlamourCommon.applyTheme(theme, options); }
function loadTheme() { NSGlamourCommon.loadTheme(); }
function toggleTheme() { NSGlamourCommon.toggleTheme(); }
NSGlamourCommon.setupThemeListeners();

function readCustomTemplate() {
  const stored = localStorage.getItem(CUSTOM_TEMPLATE_KEY);
  if (!stored || stored.includes("{染色括号}") || stored.includes("{染色或无染色}")) {
    return CUSTOM_TEMPLATE_DEFAULT;
  }
  if (stored === "{{#items}}{部位}：{装备}{换行}｜染色：{染色文案}{换行}{{/items}}") {
    return CUSTOM_TEMPLATE_DEFAULT;
  }
  return stored;
}

function writeCustomTemplate(template) {
  localStorage.setItem(CUSTOM_TEMPLATE_KEY, template);
}

function readCopyFormat() {
  const stored = localStorage.getItem(COPY_FORMAT_KEY);
  return COPY_FORMATS.has(stored) ? stored : "format1";
}

function writeCopyFormat(format) {
  localStorage.setItem(COPY_FORMAT_KEY, COPY_FORMATS.has(format) ? format : "format1");
}

function readRecentCache() { return NSGlamourCommon.readRecentCache(); }
function writeRecentCache(items) { return NSGlamourCommon.writeRecentCache(items); }

function cloneJson(value) {
  if (!value || typeof value !== "object") {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function buildRecentSnapshot() {
  const sourceUrl = state.parsed?.source_url || "";
  const displayName = normalizeConfigName(state.displayName);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: new Date().toISOString(),
    sourceName: displayName,
    displayName,
    sourceUrl,
    parsed: cloneJson(state.parsed),
    locale: state.locale,
    copyFormat: state.copyFormat,
    customTemplate: state.customTemplate,
  };
}

function normalizeConfigName(value) {
  const text = String(value || "").trim();
  return text || "未命名";
}

function askConfigName(defaultValue = state.displayName) {
  const promptText = window.NSGlamourUiLanguage?.translate?.("配置名称") || "配置名称";
  const value = window.prompt(promptText, normalizeConfigName(defaultValue));
  if (value === null) {
    return "";
  }
  return normalizeConfigName(value);
}

function saveRecentSnapshot(name = state.displayName) {
  if (!state.parsed || !Array.isArray(state.parsed.resolved_equipment) || state.parsed.resolved_equipment.length === 0) {
    setStatus("没有可保存的装备配置", true);
    return false;
  }
  state.displayName = normalizeConfigName(name);
  const snapshot = buildRecentSnapshot();
  const snapshotKey = snapshot.sourceName;
  const existing = readRecentCache().filter((item) => item.sourceName !== snapshotKey);
  writeRecentCache([snapshot, ...existing]);
  renderRecentList();
  if (sourceName) {
    sourceName.textContent = snapshot.sourceName;
  }
  setStatus(`已保存配置: ${snapshot.sourceName}`);
  return true;
}

function saveCurrentConfig() {
  const name = askConfigName();
  if (!name) {
    return;
  }
  saveRecentSnapshot(name);
}

function formatRecentTime(value) { return NSGlamourCommon.formatRecentTime(value); }

function restoreRecentSnapshot(item) {
  if (!item?.parsed) {
    return;
  }
  const parsed = cloneJson(item.parsed);
  const restoredLocale = item.locale || parsed?.source_locale || parsed?.default_locale || state.locale || DEFAULT_LOCALE;
  const displayName = normalizeConfigName(item.displayName || item.sourceName || parsed?.source_name || "");
  localStorage.removeItem(CARD_DRAFT_KEY);
  acceptPayload(parsed, {
    displayName,
    locale: restoredLocale,
    saveRecent: false,
    render: false,
    clearStatus: false,
    syncStore: false,
  });
  state.locale = getAvailableEquipinfoLocale(restoredLocale);
  state.copyFormat = COPY_FORMATS.has(item.copyFormat) ? item.copyFormat : readCopyFormat();
  state.customTemplate = typeof item.customTemplate === "string" ? item.customTemplate : readCustomTemplate();
  syncFormatControls();
  renderResult();
  writeCurrentDraft();
  ensureStains(state.locale).finally(() => {
    renderResult();
    writeCurrentDraft();
  });
  closeRecentPanel();
  setStatus(`已载入缓存: ${state.displayName}`);
}

function deleteRecentSnapshot(id) {
  const nextItems = readRecentCache().filter((item) => item.id !== id);
  writeRecentCache(nextItems);
  renderRecentList();
  setStatus("已删除这条最近载入缓存");
}

function renderRecentList() {
  NSGlamourCommon.renderRecentList(recentList, {
    onRestore: (item) => restoreRecentSnapshot(item),
    onDelete: (id) => deleteRecentSnapshot(id),
  });
}

function refreshOpenRecentPanel() {
  if (recentPanel && !recentPanel.classList.contains("hidden")) {
    renderRecentList();
  }
}

function openRecentPanel() {
  window.NSGlamourUiLanguage?.closeMenu?.();
  renderRecentList();
  recentPanel?.classList.remove("hidden");
}

function closeRecentPanel() {
  recentPanel?.classList.add("hidden");
}

function toggleRecentPanel() {
  if (!recentPanel || recentPanel.classList.contains("hidden")) {
    openRecentPanel();
    return;
  }
  closeRecentPanel();
}

function syncFormatControls() {
  copyFormatControls?.querySelectorAll("[data-copy-format]").forEach((button) => {
    button.classList.toggle("active", button.dataset.copyFormat === state.copyFormat);
  });
  customTemplatePanel?.classList.toggle("hidden", state.copyFormat !== "custom");
  if (customTemplateInput && customTemplateInput.value !== state.customTemplate) {
    customTemplateInput.value = state.customTemplate;
  }
}

function localeToHtmlLang(locale = state.locale) { return NSGlamourCommon.localeToHtmlLang(locale); }
function resolveLocalized(map, locale = state.locale) { return NSGlamourCommon.resolveLocalized(map, locale); }

function getLocaleLabel(locale) {
  return state.parsed?.locale_labels?.[locale] || LOCALE_LABELS[locale] || locale;
}

function normalizeEquipinfoLocales(locales) {
  const source = Array.isArray(locales) ? locales : [];
  const supported = new Set([...source, ...LOCALE_ORDER]);
  return LOCALE_ORDER.filter((locale) => supported.has(locale));
}

function normalizeEquipinfoLocaleLabels(labels) {
  return { ...LOCALE_LABELS, ...(labels || {}) };
}

function getAvailableLocales() {
  return normalizeEquipinfoLocales(state.parsed?.locales);
}

function getCurrentUiLanguage() {
  return window.NSGlamourUiLanguage?.get?.() || document.documentElement.lang || "zh-CN";
}

function getEquipinfoLocaleForUiLanguage(language = getCurrentUiLanguage()) {
  const normalized = window.NSGlamourUiLanguage?.normalize?.(language) || String(language || "");
  return UI_LANGUAGE_TO_EQUIPINFO_LOCALE[normalized] || "";
}

function getAvailableEquipinfoLocale(locale, fallback = state.locale) {
  const locales = getAvailableLocales();
  if (locale && locales.includes(locale)) {
    return locale;
  }
  if (fallback && locales.includes(fallback)) {
    return fallback;
  }
  return locales[0] || DEFAULT_LOCALE;
}

async function setEquipinfoLocale(locale, options = {}) {
  const nextLocale = getAvailableEquipinfoLocale(locale);
  const changed = state.locale !== nextLocale;
  state.locale = nextLocale;
  try {
    await ensureStains(state.locale);
  } catch (error) {
    console.warn("[equipinfo] failed to load stains for locale", state.locale, error);
  }
  if (options.syncStore !== false && changed) {
    syncEquipmentToStore();
  }
  if (options.render !== false) {
    renderResult();
  }
  return changed;
}

async function fetchJson(path, options = {}) { return NSGlamourCommon.fetchJson(path, options); }

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
  window.NSGlamourUiLanguage?.refresh?.(statusText);
}

function updateTextLineNumbers() {
  if (!textInput || !textLineNumbers) {
    return;
  }
  const lineCount = Math.max(1, textInput.value.split(/\r\n|\r|\n/).length);
  textLineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => String(index + 1)).join("\n");
}

function syncTextLineNumberScroll() {
  if (!textInput || !textLineNumbers) {
    return;
  }
  textLineNumbers.scrollTop = textInput.scrollTop;
}

function buildIconUrl(iconId) { return NSGlamourCommon.buildIconUrl(iconId); }

function getSlotTitle(entry) {
  const names = entry?.slot_names || {};
  const parsedNames = state.parsed?.slot_names?.[entry?.slot] || {};
  return NSGlamourCommon.cleanDataminingText(
    names[state.locale]
      || parsedNames[state.locale]
      || names[DEFAULT_LOCALE]
      || parsedNames[DEFAULT_LOCALE]
      || entry?.slot_display
      || entry?.slot
      || ""
  );
}

function getSlotDefinition(slotKey) { return NSGlamourCommon.getSlotDefinition(slotKey); }
function getSlotLabel(slotKey) { return NSGlamourCommon.getSlotLabel(slotKey); }

function makeEmptyEntry(slotKey, parsed = state.parsed) {
  return {
    slot: slotKey,
    slot_label: slotKey,
    slot_names: parsed?.slot_names?.[slotKey] || {},
    slot_display: getSlotLabel(slotKey),
    lookup_key: "",
    model: {},
    dye_id: 0,
    dye_id_2: 0,
    candidate_count: 0,
    candidates: [],
    __emptySlot: true,
  };
}

function getVisibleEntries(parsed = state.parsed) {
  const rawEntries = Array.isArray(parsed?.resolved_equipment) ? parsed.resolved_equipment : [];
  const entriesBySlot = new Map();
  for (const entry of rawEntries) {
    if (!entry?.slot || entriesBySlot.has(entry.slot)) {
      continue;
    }
    entriesBySlot.set(entry.slot, entry);
  }
  return SLOT_DEFINITIONS.map((slot) => entriesBySlot.get(slot.key) || makeEmptyEntry(slot.key, parsed));
}

function getFilledEntries(entries = getVisibleEntries()) {
  return entries.filter((entry) => Array.isArray(entry?.candidates) && entry.candidates[0]);
}

function getFilledEntryCount(parsed = state.parsed) {
  return getFilledEntries(getVisibleEntries(parsed)).length;
}

function getCandidateName(candidate) {
  return NSGlamourCommon.cleanDataminingText(resolveLocalized(candidate?.names) || candidate?.name || "");
}

function getDyeCount(entry, candidate) {
  return getCandidateDyeCount(candidate, entry?.slot);
}

function getCandidateDyeCount(candidate, slot) { return NSGlamourCommon.getCandidateDyeCount(candidate, slot); }

function getCandidateEquipSlotCategory(candidate) {
  return Number(candidate?.equip_slot_category || 0) || 0;
}

function mainHandBlocksOffHand(candidate) {
  return getCandidateEquipSlotCategory(candidate) === 13;
}

function cloneDyeEntries(entries) {
  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .map((entry) => ({
      ...entry,
      names: entry?.names && typeof entry.names === "object" ? { ...entry.names } : entry?.names,
    }));
}

function hasPositiveDyeId(entries) {
  return (Array.isArray(entries) ? entries : []).some((entry) => Number(entry?.id || 0) > 0);
}

function makeDyeEntryFromId(stainId) {
  const id = Number(stainId || 0);
  if (id <= 0) {
    return makeNoDyeEntry();
  }
  const stain = getStainById(id, state.locale) || getStainById(id, DEFAULT_LOCALE);
  const name = NSGlamourCommon.cleanDataminingText(stain?.name || "");
  return {
    id,
    name,
    names: name ? { [state.locale]: name } : {},
    hex: stain?.hex || "",
    rgb: stain?.rgb,
    group: stain?.group,
    group_name: stain?.group_name,
    sub_order: stain?.sub_order,
  };
}

function getEntryRawDyeEntries(entry) {
  const firstId = Number((entry?.source_dye_id ?? entry?.dye_id) || 0);
  const secondId = Number((entry?.source_dye_id_2 ?? entry?.dye_id_2) || 0);
  if (firstId <= 0 && secondId <= 0) {
    return [];
  }
  const entries = [makeDyeEntryFromId(firstId)];
  if (secondId > 0) {
    entries.push(makeDyeEntryFromId(secondId));
  }
  return entries;
}

function getPositiveDyeEntries(candidate, slot) {
  if (!candidate || getCandidateDyeCount(candidate, slot) <= 0) {
    return [];
  }
  return cloneDyeEntries(getDisplayDyeEntries(candidate, slot));
}

function getEntryCandidateSourceDyes(entry) {
  const candidates = Array.isArray(entry?.candidates) ? entry.candidates : [];
  for (const candidate of candidates) {
    const entries = getPositiveDyeEntries(candidate, entry.slot);
    if (entries.length) {
      return entries;
    }
  }
  return [];
}

function rememberEntrySourceDyes(entry) {
  if (!entry) {
    return;
  }
  const existingSource = cloneDyeEntries(entry.source_dye_entries);
  const candidateSource = getEntryCandidateSourceDyes(entry);
  const rawSource = getEntryRawDyeEntries(entry);
  const hasRawPositive = hasPositiveDyeId(rawSource);
  const sourceEntries = (
    hasRawPositive && !hasPositiveDyeId(existingSource)
      ? rawSource
      : existingSource.length
        ? existingSource
        : candidateSource.length
          ? candidateSource
          : rawSource
  );
  if (sourceEntries.length) {
    entry.source_dye_entries = cloneDyeEntries(sourceEntries);
  }
  if (entry.source_dye_id == null) {
    entry.source_dye_id = Number(entry.dye_id || sourceEntries[0]?.id || 0);
  }
  if (entry.source_dye_id_2 == null) {
    entry.source_dye_id_2 = Number(entry.dye_id_2 || sourceEntries[1]?.id || 0);
  }
}

function rememberActiveEntryDyes(entry, candidate) {
  const entries = getPositiveDyeEntries(candidate, entry?.slot);
  if (!entries.length) {
    return;
  }
  entry.active_dye_entries = cloneDyeEntries(entries);
  entry.active_dye_id = Number(entries[0]?.id || 0);
  entry.active_dye_id_2 = Number(entries[1]?.id || 0);
  if (entry.user_dye_override || !Array.isArray(entry.source_dye_entries) || !entry.source_dye_entries.length) {
    entry.source_dye_entries = cloneDyeEntries(entries);
    entry.source_dye_id = Number(entries[0]?.id || 0);
    entry.source_dye_id_2 = Number(entries[1]?.id || 0);
  }
}

function getRememberedEntryDyes(entry) {
  const active = cloneDyeEntries(entry?.active_dye_entries);
  const source = cloneDyeEntries(entry?.source_dye_entries);
  if (active.length && (hasPositiveDyeId(active) || !hasPositiveDyeId(source))) {
    return active;
  }
  if (source.length) {
    return source;
  }
  const rawSource = getEntryRawDyeEntries(entry);
  if (rawSource.length) {
    return rawSource;
  }
  return getEntryCandidateSourceDyes(entry);
}

function getDyeEntriesForCandidateSwitch(entry, previousCandidate, selectedCandidate) {
  const previousDyes = getPositiveDyeEntries(previousCandidate, entry?.slot);
  const rememberedDyes = getRememberedEntryDyes(entry);
  if (previousDyes.length && (entry?.user_dye_override || hasPositiveDyeId(previousDyes) || !hasPositiveDyeId(rememberedDyes))) {
    return previousDyes;
  }
  if (rememberedDyes.length) {
    return rememberedDyes;
  }
  return getPositiveDyeEntries(selectedCandidate, entry?.slot);
}

function addComplianceWarning(parsed, message) {
  if (!parsed || !message) {
    return;
  }
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
  if (!warnings.includes(message)) {
    parsed.warnings = [...warnings, message];
  }
}

function sanitizeCandidateDye(candidate, slot) {
  if (!candidate) {
    return;
  }
  const dyeCount = getCandidateDyeCount(candidate, slot);
  candidate.dye_count = dyeCount;
  if (dyeCount <= 0) {
    candidate.dye_entries = [];
    candidate.dye_display = "";
    candidate.dye_display_by_locale = {};
    return;
  }
  candidate.dye_entries = getDisplayDyeEntries(candidate, slot);
}

function localizeCandidateDyes(candidate) {
  if (!candidate || !Array.isArray(candidate.dye_entries) || !candidate.dye_entries.length) {
    return;
  }
  candidate.dye_entries = candidate.dye_entries.map((entry) => (
    isNoDyeEntry(entry)
      ? entry
      : NSGlamourCommon.Stains.localizeDyeEntry(state.stainsByLocale, entry, state.locale)
  ));
  updateDyeDisplay(candidate);
}

function sanitizeParsedEquipment(parsed) {
  if (!parsed || !Array.isArray(parsed.resolved_equipment)) {
    return;
  }
  for (const entry of parsed.resolved_equipment) {
    if (!Array.isArray(entry?.candidates)) {
      continue;
    }
    rememberEntrySourceDyes(entry);
    entry.candidates.forEach((candidate) => sanitizeCandidateDye(candidate, entry.slot));
    const candidate = entry.candidates[0];
    localizeCandidateDyes(candidate);
    rememberActiveEntryDyes(entry, candidate);
    entry.dye_id = Number(candidate?.dye_entries?.[0]?.id || 0);
    entry.dye_id_2 = Number(candidate?.dye_entries?.[1]?.id || 0);
  }

  const mainHand = parsed.resolved_equipment.find((entry) => entry?.slot === "MainHand" && entry.candidates?.[0]);
  if (mainHandBlocksOffHand(mainHand?.candidates?.[0])) {
    parsed.resolved_equipment = parsed.resolved_equipment.filter((entry) => entry?.slot !== "OffHand");
  }
}

function getStainById(stainId, locale = state.locale) { return NSGlamourCommon.Stains.getStainById(state.stainsByLocale, stainId, locale); }
function getStainName(stainId, locale = state.locale) { return NSGlamourCommon.Stains.getStainName(state.stainsByLocale, stainId, locale); }
function findStainByName(name) { return NSGlamourCommon.Stains.findStainByName(state.stainsByLocale, name, state.locale); }

async function ensureStains(locale) {
  return NSGlamourCommon.Stains.ensureStains(state.stainsByLocale, locale);
}

function isNoDyeEntry(entry) {
  return Boolean(entry?.isEmpty || Number(entry?.id || 0) === 0);
}

function getDyeEntryName(entry) {
  if (isNoDyeEntry(entry)) {
    return getNoDyeText();
  }
  const id = Number(entry?.id || 0);
  if (id > 0) {
    const localizedStain = (state.stainsByLocale[state.locale] || []).find((stain) => Number(stain.id) === id);
    const localizedName = NSGlamourCommon.cleanDataminingText(localizedStain?.name || "");
    if (localizedName) {
      return localizedName;
    }
  }
  return NSGlamourCommon.getDyeEntryName(entry, state.parsed?.no_dye_labels, state.locale);
}

function getCopyDyeEntries(dyeEntries) {
  const entries = (Array.isArray(dyeEntries) ? dyeEntries : []).filter(Boolean);
  if (!entries.length) {
    return [];
  }
  if (entries.length >= 2) {
    const first = entries[0];
    const second = entries[1];
    const firstEmpty = isNoDyeEntry(first);
    const secondEmpty = isNoDyeEntry(second);
    if (firstEmpty && !secondEmpty) {
      return [first, second];
    }
    return entries.filter((entry) => !isNoDyeEntry(entry));
  }
  return isNoDyeEntry(entries[0]) ? [] : [entries[0]];
}

function getCopyDyeText(dyeEntries, separator = " | ") {
  return getCopyDyeEntries(dyeEntries).map((dye) => getDyeEntryName(dye)).filter(Boolean).join(separator);
}

function getDyeLabel() {
  return resolveLocalized(state.parsed?.dye_labels) || "染色：";
}

function getNoDyeText() {
  return resolveLocalized(state.parsed?.no_dye_labels) || "无染色";
}

function getUndyeableText(candidate) {
  return resolveLocalized(candidate?.dye_display_by_locale) || candidate?.dye_display || "不可染色";
}

function markUiI18nDataText(element) {
  if (element) {
    element.dataset.uiI18nSkipText = "1";
  }
  return element;
}

function getDyeEntries(candidate) {
  return Array.isArray(candidate?.dye_entries) ? candidate.dye_entries : [];
}

function getCandidateDyeEntriesText(candidate, separator = " | ") {
  const names = getDyeEntries(candidate).map((dye) => getDyeEntryName(dye)).filter(Boolean);
  return names.join(separator);
}

function getCandidateDye(candidate) {
  return getCandidateDyeEntriesText(candidate) || resolveLocalized(candidate?.dye_display_by_locale) || candidate?.dye_display || "";
}

function makeNoDyeEntry() { return NSGlamourCommon.makeNoDyeEntry(state.parsed?.no_dye_labels); }

function getDisplayDyeEntries(candidate, slot) {
  return NSGlamourCommon.getDisplayDyeEntries(candidate, slot, state.parsed?.no_dye_labels);
}

function getFormatTwoDyeText(entry, candidate, separator = " | ") {
  if (!candidate || ACCESSORY_SLOTS.has(entry?.slot)) {
    return "";
  }
  const dyeCount = getDyeCount(entry, candidate);
  if (dyeCount <= 0) {
    return getNoDyeText();
  }
  return getDisplayDyeEntries(candidate, entry.slot)
    .slice(0, dyeCount)
    .map((dye) => getDyeEntryName(dye))
    .filter(Boolean)
    .join(separator);
}

function normalizeDyeEntries(candidate, options = {}) {
  return NSGlamourCommon.normalizeDyeEntries({
    candidate, slot: null, stainsByLocale: state.stainsByLocale, locale: state.locale,
    dyeCount: options.dyeCount, sourceDyeEntries: options.sourceDyeEntries,
    noDyeLabels: state.parsed?.no_dye_labels,
  });
}

function updateDyeDisplay(candidate) { return NSGlamourCommon.updateDyeDisplay(candidate, state.stainsByLocale, state.locale); }

function normalizeImportedCandidate(result, previousCandidate, slot, options = {}) {
  const previousDyes = Array.isArray(options.sourceDyeEntries)
    ? options.sourceDyeEntries
    : Array.isArray(previousCandidate?.dye_entries)
      ? previousCandidate.dye_entries
      : [];
  const dyeCount = getCandidateDyeCount(result, slot);
  const candidate = {
    ...result,
    key: result?.key,
    key_label: result?.key_label || previousCandidate?.key_label || "物品ID",
    names: result?.names || {},
    name: NSGlamourCommon.cleanDataminingText(result?.name || resolveLocalized(result?.names) || ""),
    icon: result?.icon || 0,
    dye_count: dyeCount,
    dye_display_by_locale: result?.dye_display_by_locale || {},
    dye_display: NSGlamourCommon.cleanDataminingText(result?.dye_display || ""),
    dye_entries: [],
    is_emperor: result?.is_emperor === true,
    model_main: result?.model_main || {},
  };
  candidate.dye_entries = normalizeDyeEntries(candidate, { dyeCount, sourceDyeEntries: previousDyes });
  return candidate;
}

function getDyeText(entry, candidate, separator = "/") {
  if (!candidate || ACCESSORY_SLOTS.has(entry.slot)) {
    return "";
  }
  return getDisplayDyeEntries(candidate, entry.slot).map((dye) => getDyeEntryName(dye)).filter(Boolean).join(separator);
}

function getEntryModelCode(entry) {
  const raw = entry?.candidates?.[0]?.model_main?.raw;
  if (raw) {
    return String(raw).replace(/\s*,\s*/g, ",");
  }
  const model = entry?.model || {};
  if (Number.isFinite(Number(model.id))) {
    return String(Number(model.id));
  }
  if (Number.isFinite(Number(model.set))) {
    return [model.set, model.base, model.variant, 0].map((value) => Number(value) || 0).join(",");
  }
  if (Number.isFinite(Number(model.base))) {
    return [model.base, model.variant, 0, 0].map((value) => Number(value) || 0).join(",");
  }
  return "";
}

function upsertResolvedEntry(entry) {
  if (!state.parsed || !entry?.slot) {
    return;
  }
  if (!Array.isArray(state.parsed.resolved_equipment)) {
    state.parsed.resolved_equipment = [];
  }
  const index = state.parsed.resolved_equipment.findIndex((candidate) => candidate?.slot === entry.slot);
  if (index >= 0) {
    state.parsed.resolved_equipment[index] = entry;
  } else {
    state.parsed.resolved_equipment.push(entry);
  }
}

function replaceEntryCandidate(entry, result) {
  const previousCandidate = Array.isArray(entry.candidates) ? entry.candidates[0] : null;
  rememberEntrySourceDyes(entry);
  rememberActiveEntryDyes(entry, previousCandidate);
  const sourceDyeEntries = getDyeEntriesForCandidateSwitch(entry, previousCandidate, result);
  const candidate = normalizeImportedCandidate(result, previousCandidate, entry.slot, { sourceDyeEntries });
  entry.candidates = [candidate];
  entry.candidate_count = 1;
  entry.__emptySlot = false;
  entry.lookup_key = `SEARCH|${entry.slot || ""}|${candidate.key || ""}`;
  entry.model = {};
  if (candidate.model_main?.raw) {
    entry.lookup_key = `${entry.slot_label || entry.slot || "SEARCH"}|${candidate.model_main.raw}`;
  }
  if (candidate.dye_count <= 0) {
    entry.dye_id = 0;
    entry.dye_id_2 = 0;
  }
  upsertResolvedEntry(entry);
  sanitizeParsedEquipment(state.parsed);
  writeCurrentDraft();
}

function selectEntryCandidate(entry, candidateKey) {
  if (!entry || !Array.isArray(entry.candidates) || entry.candidates.length <= 1) {
    return false;
  }
  const normalizedKey = String(candidateKey);
  const index = entry.candidates.findIndex((candidate) => String(candidate?.key) === normalizedKey);
  if (index <= 0) {
    return false;
  }
  rememberEntrySourceDyes(entry);
  const [selected] = entry.candidates.splice(index, 1);
  const previous = entry.candidates[0];
  rememberActiveEntryDyes(entry, previous);
  const sourceDyeEntries = getDyeEntriesForCandidateSwitch(entry, previous, selected);
  selected.dye_entries = normalizeDyeEntries(selected, { dyeCount: getCandidateDyeCount(selected, entry.slot), sourceDyeEntries });
  updateDyeDisplay(selected);
  entry.candidates.unshift(selected);
  entry.candidate_count = entry.candidates.length;
  entry.__emptySlot = false;
  if (selected.model_main?.raw) {
    entry.lookup_key = `${entry.slot_label || entry.slot || "SEARCH"}|${selected.model_main.raw}`;
  }
  upsertResolvedEntry(entry);
  sanitizeParsedEquipment(state.parsed);
  writeCurrentDraft();
  return true;
}

function clearEntryCandidate(entry) {
  if (!state.parsed || !entry?.slot) {
    return;
  }
  state.parsed.resolved_equipment = (state.parsed.resolved_equipment || []).filter((candidate) => candidate?.slot !== entry.slot);
  writeCurrentDraft();
}

function renderLanguageControls() {
  languageControls.innerHTML = "";
  const locales = getAvailableLocales();
  if (!locales.includes(state.locale)) {
    state.locale = locales[0] || DEFAULT_LOCALE;
  }
  for (const locale of locales) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "language-button";
    button.textContent = getLocaleLabel(locale);
    button.classList.toggle("active", locale === state.locale);
    button.addEventListener("click", () => {
      setEquipinfoLocale(locale);
    });
    languageControls.appendChild(button);
  }
}

function closeDyePickers() { NSGlamourCommon.closeAllDyePickers(); }

function closeCandidatePickers() {
  document.querySelectorAll(".candidate-picker-panel").forEach((panel) => panel.remove());
  document.querySelectorAll(".candidate-switch-button.active").forEach((button) => button.classList.remove("active"));
}

function groupStains(stains) { return NSGlamourCommon.groupStains(stains); }
function normalizeDyeSearchText(value) { return NSGlamourCommon.normalizeDyeSearchText(value); }
function stainMatchesQuery(stain, query) { return NSGlamourCommon.stainMatchesQuery(stain, query); }

function setDyeEntry(entry, candidate, index, stain) {
  if (!candidate) return;
  const dyeCount = getDyeCount(entry, candidate);
  if (index < 0 || index >= dyeCount) return;
  candidate.dye_entries = normalizeDyeEntries(candidate, { dyeCount, sourceDyeEntries: candidate.dye_entries });
  const fallbackName = NSGlamourCommon.cleanDataminingText(stain.name || "");
  const names = stain.names || Object.fromEntries(LOCALE_ORDER.map((locale) => [locale, fallbackName]));
  candidate.dye_entries[index] = { id: stain.id, name: fallbackName, names, hex: stain.hex, rgb: stain.rgb };
  entry.dye_id = Number(candidate.dye_entries[0]?.id || 0);
  entry.dye_id_2 = Number(candidate.dye_entries[1]?.id || 0);
  updateDyeDisplay(candidate);
  entry.user_dye_override = true;
  rememberActiveEntryDyes(entry, candidate);
  upsertResolvedEntry(entry);
  writeCurrentDraft();
  renderResult();
}

function renderDyePickerOptions(panel, stains, query, entry, candidate, index) {
  NSGlamourCommon.renderDyePickerOptions(panel, stains, query, {
    onSelect: (stain) => setDyeEntry(entry, candidate, index, stain),
  });
}

function openDyePicker(button, entry, candidate, index) {
  const stains = state.stainsByLocale[state.locale] || [];
  NSGlamourCommon.openDyePicker(button, stains, {
    onSelect: (stain) => setDyeEntry(entry, candidate, index, stain),
  });
}

function renderDye(container, entry, candidate) {
  container.innerHTML = "";
  const dyes = getDisplayDyeEntries(candidate, entry.slot);
  if (!dyes.length || ACCESSORY_SLOTS.has(entry.slot)) {
    if (candidate && !ACCESSORY_SLOTS.has(entry.slot) && Number(candidate.dye_count || 0) <= 0) {
      container.textContent = getUndyeableText(candidate);
      markUiI18nDataText(container);
    }
    return;
  }
  dyes.forEach((dye, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "editor-dye-select";

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "dye-picker-button equipinfo-dye-chip";
    chip.classList.toggle("empty-dye", Boolean(dye.isEmpty));
    chip.title = dyes.length > 1 ? `染色${index + 1}` : "染色";
    chip.style.setProperty("--dye-color", dye.hex || "#000000");
    chip.textContent = getDyeEntryName(dye);
    chip.addEventListener("click", (event) => {
      event.stopPropagation();
      openDyePicker(chip, entry, candidate, index);
    });
    markUiI18nDataText(chip);
    wrapper.appendChild(chip);
    container.appendChild(wrapper);
  });
}

function renderCandidatePickerOption(candidate, entry, currentKey) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "candidate-picker-option";
  button.classList.toggle("active", String(candidate?.key) === currentKey);

  const iconUrl = buildIconUrl(candidate.icon);
  if (iconUrl) {
    const icon = document.createElement("img");
    icon.src = iconUrl;
    icon.alt = getCandidateName(candidate);
    icon.loading = "lazy";
    icon.referrerPolicy = "no-referrer";
    icon.addEventListener("error", () => icon.remove());
    button.appendChild(icon);
  }

  const text = document.createElement("span");
  text.textContent = getCandidateName(candidate);
  text.lang = localeToHtmlLang(state.locale);
  markUiI18nDataText(text);
  button.appendChild(text);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (selectEntryCandidate(entry, candidate.key)) {
      setStatus(`已切换：${getSlotTitle(entry)} / ${getCandidateName(candidate)}`);
    }
    closeCandidatePickers();
    renderResult();
  });

  return button;
}

function openCandidatePicker(button, entry) {
  const candidates = Array.isArray(entry?.candidates) ? entry.candidates : [];
  if (candidates.length <= 1) {
    return;
  }
  const existingPanel = button.parentElement?.querySelector(".candidate-picker-panel");
  closeCandidatePickers();
  if (existingPanel) {
    return;
  }

  button.classList.add("active");
  const panel = document.createElement("div");
  panel.className = "candidate-picker-panel";
  panel.addEventListener("click", (event) => event.stopPropagation());
  const currentKey = String(candidates[0]?.key);
  candidates.forEach((candidate) => {
    panel.appendChild(renderCandidatePickerOption(candidate, entry, currentKey));
  });
  button.parentElement?.appendChild(panel);
}

function renderSearchResultButton(result, entry, resultsBox) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "search-result";

  const iconUrl = buildIconUrl(result.icon);
  if (iconUrl) {
    const img = document.createElement("img");
    img.src = iconUrl;
    img.alt = result.name || "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    button.appendChild(img);
  }

  const text = document.createElement("span");
  text.textContent = result.name || resolveLocalized(result.names) || "";
  button.appendChild(text);

  button.addEventListener("click", () => {
    replaceEntryCandidate(entry, result);
    resultsBox.innerHTML = "";
    renderResult();
    setStatus(`已更换：${getSlotTitle(entry)} / ${getCandidateName(entry.candidates[0])}`);
  });
  return button;
}

async function searchItems(entry, query, resultsBox) {
  resultsBox.innerHTML = "";
  if (!query.trim()) {
    return;
  }

  const params = new URLSearchParams({
    slot: entry.slot || "",
    q: query.trim(),
    locale: state.locale,
    limit: "20",
  });
  try {
    const response = await fetch(appPath(`/api/search-items?${params.toString()}`), { cache: "no-store" });
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "无搜索结果";
      resultsBox.appendChild(empty);
      window.NSGlamourUiLanguage?.refresh?.(resultsBox);
      return;
    }

    for (const result of results) {
      resultsBox.appendChild(renderSearchResultButton(result, entry, resultsBox));
    }
    window.NSGlamourUiLanguage?.refresh?.(resultsBox);
  } catch (error) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = error.message || "搜索失败";
    resultsBox.appendChild(empty);
    window.NSGlamourUiLanguage?.refresh?.(resultsBox);
  }
}

function renderSearch(container, entry) {
  container.innerHTML = "";
  container.classList.add("editor-search-mode");

  const searchWrap = document.createElement("div");
  searchWrap.className = "editor-search";

  const input = document.createElement("input");
  input.className = "item-search-input";
  input.type = "search";
  input.placeholder = "搜索装备名";
  searchWrap.appendChild(input);

  const resultsBox = document.createElement("div");
  resultsBox.className = "search-results";
  searchWrap.appendChild(resultsBox);

  let timerId = 0;
  input.addEventListener("input", () => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => searchItems(entry, input.value, resultsBox), 180);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      renderResult();
    }
  });

  container.appendChild(searchWrap);
}

function renderEntryItem(container, entry, candidate) {
  container.innerHTML = "";
  container.classList.remove("editor-search-mode");

  const iconUrl = buildIconUrl(candidate.icon);
  if (iconUrl) {
    const icon = document.createElement("img");
    icon.className = "editor-item-icon";
    icon.src = iconUrl;
    icon.alt = getCandidateName(candidate);
    icon.loading = "lazy";
    icon.referrerPolicy = "no-referrer";
    icon.addEventListener("error", () => icon.remove());
    container.appendChild(icon);
  }

  const body = document.createElement("div");
  body.className = "editor-item-body";

  const header = document.createElement("div");
  header.className = "editor-item-title";

  const name = document.createElement("strong");
  name.textContent = getCandidateName(candidate);
  name.lang = localeToHtmlLang(state.locale);
  markUiI18nDataText(name);
  header.appendChild(name);

  if (Array.isArray(entry.candidates) && entry.candidates.length > 1) {
    const switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "candidate-switch-button";
    switchButton.title = "切换匹配项";
    switchButton.setAttribute("aria-label", "切换匹配项");
    switchButton.textContent = "⇄";
    switchButton.addEventListener("click", (event) => {
      event.stopPropagation();
      closeDyePickers();
      openCandidatePicker(switchButton, entry);
    });
    header.appendChild(switchButton);
  }

  body.appendChild(header);

  const dyeControls = document.createElement("div");
  dyeControls.className = "editor-dye-controls";
  renderDye(dyeControls, entry, candidate);
  body.appendChild(dyeControls);

  container.appendChild(body);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "inline-delete-button";
  clearButton.title = "删除当前装备";
  clearButton.textContent = "×";
  clearButton.addEventListener("click", () => {
    clearEntryCandidate(entry);
    renderResult();
  });
  container.appendChild(clearButton);
}

function renderSlotNode(entry) {
  const candidate = Array.isArray(entry.candidates) ? entry.candidates[0] : null;
  const node = slotTemplate.content.firstElementChild.cloneNode(true);
  const slotName = node.querySelector(".editor-slot-name");
  slotName.textContent = getSlotTitle(entry);
  slotName.lang = localeToHtmlLang(state.locale);
  markUiI18nDataText(slotName);

  const itemBox = node.querySelector(".editor-item");
  if (!candidate) {
    renderSearch(itemBox, entry);
  } else {
    renderEntryItem(itemBox, entry, candidate);
  }
  return node;
}

function renderSlotErrorNode(slotKey, error) {
  const node = document.createElement("article");
  node.className = "editor-row";
  const slotName = document.createElement("h3");
  slotName.className = "editor-slot-name";
  slotName.textContent = getSlotLabel(slotKey);
  const itemBox = document.createElement("div");
  itemBox.className = "editor-item editor-error";
  itemBox.textContent = `装备栏渲染失败：${error?.message || error || "未知错误"}`;
  node.append(slotName, itemBox);
  return node;
}

function renderSlotColumn(entriesBySlot, slotKeys) {
  const column = document.createElement("div");
  column.className = "equipinfo-slot-column";
  for (const slotKey of slotKeys) {
    const entry = entriesBySlot.get(slotKey) || makeEmptyEntry(slotKey);
    try {
      column.appendChild(renderSlotNode(entry));
    } catch (error) {
      console.error("[equipinfo] failed to render slot", slotKey, error);
      column.appendChild(renderSlotErrorNode(slotKey, error));
    }
  }
  return column;
}

function renderSlotGrid(entries) {
  if (!slotTemplate) {
    slotGrid.textContent = "装备栏模板缺失";
    return;
  }
  const entriesBySlot = new Map(entries.filter((entry) => entry?.slot).map((entry) => [entry.slot, entry]));
  const fragment = document.createDocumentFragment();
  fragment.appendChild(renderSlotColumn(entriesBySlot, EQUIPINFO_LEFT_COLUMN_SLOTS));
  fragment.appendChild(renderSlotColumn(entriesBySlot, EQUIPINFO_RIGHT_COLUMN_SLOTS));
  slotGrid.replaceChildren(fragment);
}

function getBooleanText(value) {
  return value ? "是" : "否";
}

function safeStringify(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "";
  }
}

function isEmperorItem(candidate) {
  return Boolean(candidate && candidate.is_emperor);
}

function getDyeEntryData(entry, index, entries) {
  return {
    "染剂序号": String(index + 1),
    "首个染剂": getBooleanText(index === 0),
    "末个染剂": getBooleanText(index === entries.length - 1),
    "染剂": getDyeEntryName(entry),
    "染剂ID": entry?.id == null ? "" : String(entry.id),
    "染剂色值": entry?.hex || "",
    "染剂RGB": entry?.rgb == null ? "" : String(entry.rgb),
    "染剂分组": entry?.group == null ? "" : String(entry.group),
    "染剂分组名": entry?.group_name || "",
    "染剂排序": entry?.sub_order == null ? "" : String(entry.sub_order),
    "染剂原始JSON": safeStringify(entry),
    "__isFirstDye": index === 0,
    "__isLastDye": index === entries.length - 1,
  };
}

function getGlobalTemplateData() {
  return {
    "文件名": state.parsed?.source_name || "",
    "文件类型": state.parsed?.file_type || "",
    "种族": state.parsed?.race || "",
    "性别": state.parsed?.gender || "",
    "语言": getLocaleLabel(state.locale),
    "语言代码": state.locale,
    "装备总数": state.parsed ? String(getFilledEntryCount()) : "",
    "染色标签": getDyeLabel(),
    "原始JSON": safeStringify(state.parsed),
    "换行": "\n",
  };
}

function getTemplateData(entry, index = 0, entries = []) {
  const candidate = Array.isArray(entry.candidates) ? entry.candidates[0] : null;
  const title = getSlotTitle(entry);
  const name = candidate ? getCandidateName(candidate) : "";
  const dyeCount = getDyeCount(entry, candidate);
  const canDye = Boolean(candidate && !ACCESSORY_SLOTS.has(entry.slot) && dyeCount > 0);
  const cannotDye = Boolean(candidate && !ACCESSORY_SLOTS.has(entry.slot) && dyeCount <= 0);
  const dyeEntries = canDye ? getDisplayDyeEntries(candidate, entry.slot) : [];
  const dyeOne = dyeEntries[0] || null;
  const dyeTwo = dyeEntries[1] || null;
  const copyDyeEntries = canDye ? getCopyDyeEntries(dyeEntries) : [];
  const copyDyeOne = copyDyeEntries[0] || null;
  const copyDyeTwo = copyDyeEntries[1] || null;
  const isEmperor = Boolean(candidate && isEmperorItem(candidate));
  const dyeText = canDye ? getCopyDyeText(dyeEntries, " | ") : "";

  return {
    ...getGlobalTemplateData(),
    "部位": title,
    "部位名": title,
    "部位代码": entry.slot || "",
    "部位类型": entry.slot_label || "",
    "查找键": entry.lookup_key || "",
    "模型编号": getEntryModelCode(entry),
    "模型ID": entry.model?.id == null ? "" : String(entry.model.id),
    "模型套装": entry.model?.set == null ? "" : String(entry.model.set),
    "模型基础": entry.model?.base == null ? "" : String(entry.model.base),
    "模型变体": entry.model?.variant == null ? "" : String(entry.model.variant),
    "装备": name,
    "装备名": name,
    "装备ID": candidate?.key == null ? "" : String(candidate.key),
    "物品ID标签": candidate?.key_label || "物品ID",
    "图标ID": candidate?.icon == null ? "" : String(candidate.icon),
    "装备部位类型": candidate?.slot_label || "",
    "装备部位分类": candidate?.equip_slot_category == null ? "" : String(candidate.equip_slot_category),
    "模型主值": candidate?.model_main?.primary == null ? "" : String(candidate.model_main.primary),
    "模型副值": candidate?.model_main?.secondary == null ? "" : String(candidate.model_main.secondary),
    "模型三值": candidate?.model_main?.tertiary == null ? "" : String(candidate.model_main.tertiary),
    "模型四值": candidate?.model_main?.quaternary == null ? "" : String(candidate.model_main.quaternary),
    "模型原始值": candidate?.model_main?.raw || "",
    "候选数量": String(entry.candidate_count || entry.candidates?.length || 0),
    "序号": String(index + 1),
    "首项": getBooleanText(index === 0),
    "末项": getBooleanText(index === entries.length - 1),
    "可染色": getBooleanText(Boolean(canDye)),
    "不可染色": getBooleanText(cannotDye),
    "染色数量": String(dyeCount),
    "染色ID1": entry.dye_id == null ? "" : String(entry.dye_id),
    "染色ID2": entry.dye_id_2 == null ? "" : String(entry.dye_id_2),
    "后端染色文本": candidate ? resolveLocalized(candidate.dye_display_by_locale) || candidate.dye_display || "" : "",
    "染色1": canDye && copyDyeOne ? getDyeEntryName(copyDyeOne) : "",
    "染剂1": canDye && copyDyeOne ? getDyeEntryName(copyDyeOne) : "",
    "染色1ID": canDye && copyDyeOne?.id != null ? String(copyDyeOne.id) : "",
    "染剂1ID": canDye && copyDyeOne?.id != null ? String(copyDyeOne.id) : "",
    "染色1色值": canDye && copyDyeOne ? copyDyeOne.hex || "" : "",
    "染剂1色值": canDye && copyDyeOne ? copyDyeOne.hex || "" : "",
    "染色2": canDye && copyDyeTwo ? getDyeEntryName(copyDyeTwo) : "",
    "染剂2": canDye && copyDyeTwo ? getDyeEntryName(copyDyeTwo) : "",
    "染色2ID": canDye && copyDyeTwo?.id != null ? String(copyDyeTwo.id) : "",
    "染剂2ID": canDye && copyDyeTwo?.id != null ? String(copyDyeTwo.id) : "",
    "染色2色值": canDye && copyDyeTwo ? copyDyeTwo.hex || "" : "",
    "染剂2色值": canDye && copyDyeTwo ? copyDyeTwo.hex || "" : "",
    "染色文案": dyeText,
    "无染色文本": getNoDyeText(),
    "皇帝套": getBooleanText(isEmperor),
    "非皇帝套": getBooleanText(!isEmperor),
    "装备原始JSON": safeStringify(candidate),
    "部位原始JSON": safeStringify(entry),
    "__canDye": Boolean(canDye),
    "__cannotDye": cannotDye,
    "__isEmperor": isEmperor,
    "__isNotEmperor": !isEmperor,
    "__isFirst": index === 0,
    "__isLast": index === entries.length - 1,
    "__dyeEntries": canDye ? copyDyeEntries : [],
  };
}

function replaceTemplateTokens(template, data) {
  return template.replace(/\{([^{}]+)\}/g, (match, key) => {
    const normalizedKey = key.trim();
    return Object.prototype.hasOwnProperty.call(data, normalizedKey) ? data[normalizedKey] : match;
  });
}

function getSectionValue(key, data) {
  if (key === "可染色") {
    return data.__canDye;
  }
  if (key === "不可染色") {
    return data.__cannotDye;
  }
  if (key === "皇帝套") {
    return data.__isEmperor;
  }
  if (key === "非皇帝套") {
    return data.__isNotEmperor;
  }
  if (key === "首项") {
    return data.__isFirst;
  }
  if (key === "末项") {
    return data.__isLast;
  }
  if (key === "首个染剂") {
    return data.__isFirstDye;
  }
  if (key === "末个染剂") {
    return data.__isLastDye;
  }
  if (key === "dyes" || key === "染剂") {
    return data.__dyeEntries || [];
  }
  return data[key];
}

function renderConditionalSections(template, data) {
  let rendered = template;
  const sectionPattern = /\{\{([#^])([^{}]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g;
  let previous = "";

  while (rendered !== previous) {
    previous = rendered;
    rendered = rendered.replace(sectionPattern, (match, mode, rawKey, block) => {
      const key = rawKey.trim();
      const value = getSectionValue(key, data);
      if (Array.isArray(value)) {
        const shouldRender = mode === "#" ? value.length > 0 : value.length === 0;
        if (!shouldRender) {
          return "";
        }
        return value
          .map((entry, index) => {
            const childData = {
              ...data,
              ...getDyeEntryData(entry, index, value),
            };
            return renderTemplateBlock(block, childData);
          })
          .join("");
      }

      const truthy = Boolean(value);
      const shouldRender = mode === "#" ? truthy : !truthy;
      return shouldRender ? renderTemplateBlock(block, data) : "";
    });
  }

  return rendered;
}

function renderTemplateBlock(template, data) {
  return replaceTemplateTokens(renderConditionalSections(template, data), data);
}

function renderTemplate(template, entries) {
  const data = getGlobalTemplateData();
  const rendered = template.replace(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/g, (match, block) => {
    return entries
      .map((entry, index) => renderTemplateBlock(block, getTemplateData(entry, index, entries)))
      .join("");
  });
  return renderTemplateBlock(rendered, data);
}

function renderFormatOne(entries) {
  return renderTemplate(CUSTOM_TEMPLATE_DEFAULT, entries).trim();
}

function renderFormatTwo(entries) {
  const names = [];
  const dyes = [];
  for (const entry of entries) {
    const data = getTemplateData(entry, names.length, entries);
    const name = data["装备"];
    if (!name) {
      continue;
    }
    names.push(name);
    const candidate = Array.isArray(entry?.candidates) ? entry.candidates[0] : null;
    const dyeText = getFormatTwoDyeText(entry, candidate).trim();
    if (dyeText) {
      dyes.push(dyeText);
    }
  }
  return [names.join("\n"), dyes.join("\n")].filter(Boolean).join("\n\n");
}

function renderFormatThree(entries) {
  return entries
    .map((entry, index) => {
      const data = getTemplateData(entry, index, entries);
      if (!data["装备名"]) {
        return "";
      }
      const dyeText = data.__dyeEntries.map((dye) => getDyeEntryName(dye)).filter(Boolean).join("/");
      return `${data["部位名"]}：${data["装备名"]}${dyeText ? `（${dyeText}）` : ""}`;
    })
    .filter(Boolean)
    .join("\n");
}

function renderFormatFour(entries) {
  const names = [];
  const dyes = [];
  for (const entry of entries) {
    const data = getTemplateData(entry, names.length, entries);
    const name = data["装备名"];
    if (!name) {
      continue;
    }
    names.push(name);
    if (data.__canDye) {
      const dyeText = data.__dyeEntries
        .map((dye) => getDyeEntryName(dye))
        .filter(Boolean)
        .join(" ")
        .trim();
      if (dyeText) {
        dyes.push(dyeText);
      }
    }
  }
  return [names.join("/"), dyes.join("/")].filter(Boolean).join("\n");
}

function renderCopyText(entries) {
  if (state.copyFormat === "format2") {
    return renderFormatTwo(entries);
  }
  if (state.copyFormat === "format3") {
    return renderFormatThree(entries);
  }
  if (state.copyFormat === "format4") {
    return renderFormatFour(entries);
  }
  if (state.copyFormat === "custom") {
    return renderTemplate(state.customTemplate, entries).trim();
  }
  return renderFormatOne(entries);
}

function renderWarnings() {
  const warnings = Array.isArray(state.parsed?.warnings) ? state.parsed.warnings : [];
  warningsBox.innerHTML = "";
  warningsBox.hidden = warnings.length === 0;
  warnings.forEach((warning) => {
    const item = document.createElement("div");
    item.textContent = warning;
    warningsBox.appendChild(item);
  });
  window.NSGlamourUiLanguage?.refresh?.(warningsBox);
}

function renderResult() {
  closeCandidatePickers();
  closeDyePickers();
  if (!state.parsed) {
    state.parsed = createEmptyParsedPayload();
  }
  sanitizeParsedEquipment(state.parsed);
  const entries = getVisibleEntries();
  const filledEntries = getFilledEntries(entries);
  resultSection.classList.remove("hidden");
  copySection.classList.remove("hidden");
  syncFormatControls();
  renderLanguageControls();
  sourceName.textContent = normalizeConfigName(state.displayName);
  metaText.textContent = "";
  metaText.hidden = true;
  renderSlotGrid(entries);
  copyOutput.value = renderCopyText(filledEntries);
  renderWarnings();
  window.NSGlamourUiLanguage?.refresh?.();
}

function acceptPayload(payload, options = {}) {
  state.parsed = {
    ...createEmptyParsedPayload(),
    ...payload,
    locales: normalizeEquipinfoLocales(payload?.locales),
    locale_labels: normalizeEquipinfoLocaleLabels(payload?.locale_labels),
    warnings: Array.isArray(payload?.warnings) ? payload.warnings : [],
    resolved_equipment: Array.isArray(payload?.resolved_equipment) ? payload.resolved_equipment : [],
  };
  state.displayName = normalizeConfigName(options.displayName || "");
  const preferred = options.locale || payload.source_locale || payload.default_locale || DEFAULT_LOCALE;
  state.locale = state.parsed.locales.includes(preferred) ? preferred : DEFAULT_LOCALE;
  sanitizeParsedEquipment(state.parsed);
  if (options.render !== false) {
    ensureStains(state.locale).finally(() => renderResult());
  }
  if (options.clearStatus !== false) {
    setStatus("");
  }
  if (options.syncStore !== false) {
    syncEquipmentToStore();
  }
}

async function importLink(event) {
  event.preventDefault();
  const url = urlInput?.value.trim() || "";
  if (!url) {
    setStatus("请输入石之家或 Eorzea Collection 幻化链接", true);
    return;
  }
  setStatus("正在读取网页……");
  const data = await fetchJson("/api/import-glamour-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  acceptPayload(data);
}

function isCharaFile(file) {
  return Boolean(file?.name && file.name.toLowerCase().endsWith(".chara"));
}

function getDroppedCharaFile(dataTransfer) {
  const files = Array.from(dataTransfer?.files || []);
  return files.find(isCharaFile) || null;
}

function dragMayContainFile(dataTransfer) {
  const types = Array.from(dataTransfer?.types || []);
  return types.includes("Files");
}

function getEventCharaFile(event) {
  return getDroppedCharaFile(event.dataTransfer);
}

function setCharaDragover(active) {
  if (!charaDropHost || !charaDropOverlay) {
    return;
  }
  charaDropHost.classList.toggle("chara-dragover", Boolean(active));
}

async function importCharaFile(file) {
  if (!CHARA_IMPORT_ENABLED) {
    return;
  }
  if (!isCharaFile(file)) {
    return;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    setStatus(`文件超过 ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`, true);
    return;
  }
  setStatus("正在读取配置……");
  const formData = new FormData();
  formData.append("file", file);
  const data = await fetchJson("/api/parse-chara", {
    method: "POST",
    body: formData,
  });
  acceptPayload(data);
}

function setupHiddenCharaDrop() {
  if (!CHARA_IMPORT_ENABLED || !charaDropHost || !charaDropTarget || !charaDropOverlay) {
    return;
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    charaDropTarget.addEventListener(eventName, (event) => {
      if (!dragMayContainFile(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      setCharaDragover(true);
    });
  });

  charaDropTarget.addEventListener("dragleave", (event) => {
    if (charaDropTarget.contains(event.relatedTarget)) {
      return;
    }
    setCharaDragover(false);
  });

  charaDropTarget.addEventListener("drop", (event) => {
    const file = getEventCharaFile(event);
    if (!file) {
      setCharaDragover(false);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setCharaDragover(false);
    importCharaFile(file).catch((error) => setStatus(error.message || "读取失败", true));
  });
}

async function parseText(event) {
  event.preventDefault();
  const text = textInput.value.trim();
  if (!text) {
    setStatus("请输入装备文字", true);
    return;
  }
  setStatus("正在识别文字……");
  const data = await fetchJson("/api/equipinfo/parse-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source_locale: sourceLocaleSelect.value || DEFAULT_LOCALE }),
  });
  acceptPayload(data);
}

async function copyText() {
  const text = copyOutput.value;
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    try {
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
    } finally {
      input.remove();
    }
  }
  setStatus("已复制转换文案");
}

function buildDraftFromParsedPayload(parsed) {
  return NSGlamourCommon.buildDraftFromParsedPayload(parsed, { stainsByLocale: state.stainsByLocale });
}

function writeCurrentDraft() {
  if (!state.parsed) { localStorage.removeItem(CARD_DRAFT_KEY); return; }
  NSGlamourCommon.writeCurrentDraft(buildDraftFromParsedPayload(state.parsed));
  syncEquipmentToStore();
}

function openTemplateWithCurrentData() {
  if (!state.parsed) {
    state.parsed = createEmptyParsedPayload();
  }
  const draft = buildDraftFromParsedPayload(state.parsed);
  if (!draft.entries.length) {
    setStatus("没有可送到模板的装备", true);
    return;
  }
  localStorage.setItem(CARD_DRAFT_KEY, JSON.stringify(draft));
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "nsglamour:open-template-workspace", forceReload: true }, window.location.origin);
    setStatus("已送到模板");
    return;
  }
  window.location.href = appPath("/template");
}

function populateSourceLocales() {
  sourceLocaleSelect.innerHTML = "";
  for (const locale of LOCALE_ORDER) {
    const option = document.createElement("option");
    option.value = locale;
    option.textContent = getLocaleLabel(locale);
    sourceLocaleSelect.appendChild(option);
  }
  sourceLocaleSelect.value = DEFAULT_LOCALE;
}

function clearAll() {
  state.parsed = createEmptyParsedPayload();
  state.displayName = "";
  state.copyFormat = readCopyFormat();
  state.customTemplate = readCustomTemplate();
  if (urlInput) {
    urlInput.value = "";
  }
  textInput.value = "";
  updateTextLineNumbers();
  warningsBox.innerHTML = "";
  syncFormatControls();
  localStorage.removeItem(CARD_DRAFT_KEY);
  renderResult();
  _storeIgnoreSync = true;
  try {
    NSGlamourStore.equipment.clear();
  } finally {
    _storeIgnoreSync = false;
  }
  setStatus("等待输入");
}

linkForm?.addEventListener("submit", (event) => {
  importLink(event).catch((error) => setStatus(error.message || "读取失败", true));
});
setupHiddenCharaDrop();

textForm.addEventListener("submit", (event) => {
  parseText(event).catch((error) => setStatus(error.message || "识别失败", true));
});

// "送到模板" button removed — sync is automatic now
saveConfigButton?.addEventListener("click", saveCurrentConfig);
clearButton.addEventListener("click", clearAll);
themeToggleBtn?.addEventListener("click", () => {
  closeRecentPanel();
  window.NSGlamourUiLanguage?.closeMenu?.();
  toggleTheme();
});
recentButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleRecentPanel();
});
recentPanel?.addEventListener("click", (event) => event.stopPropagation());
clearRecentButton?.addEventListener("click", () => {
  writeRecentCache([]);
  renderRecentList();
  setStatus("已清空最近载入缓存");
});
window.addEventListener("storage", (event) => {
  if (event.key === RECENT_CACHE_KEY) {
    refreshOpenRecentPanel();
  }
});
document.addEventListener("click", closeRecentPanel);
document.addEventListener("click", closeCandidatePickers);
window.addEventListener("nsglamour:header-popover-open", (event) => {
  if (event.detail?.source !== "recent") {
    closeRecentPanel();
  }
});
textInput?.addEventListener("input", updateTextLineNumbers);
textInput?.addEventListener("scroll", syncTextLineNumberScroll);

function insertTemplateToken(token) {
  if (!customTemplateInput || !token) {
    return;
  }

  const start = customTemplateInput.selectionStart ?? customTemplateInput.value.length;
  const end = customTemplateInput.selectionEnd ?? start;
  const before = customTemplateInput.value.slice(0, start);
  const after = customTemplateInput.value.slice(end);
  customTemplateInput.value = `${before}${token}${after}`;
  const nextCursor = start + token.length;
  customTemplateInput.focus();
  customTemplateInput.setSelectionRange(nextCursor, nextCursor);
  state.customTemplate = customTemplateInput.value;
  writeCustomTemplate(state.customTemplate);
  renderResult();
}

tokenChips.forEach((button) => {
  button.addEventListener("click", () => insertTemplateToken(button.dataset.token || ""));
});

customTemplateInput?.addEventListener("input", () => {
  state.customTemplate = customTemplateInput.value;
  writeCustomTemplate(state.customTemplate);
  renderResult();
});

resetTemplateButton?.addEventListener("click", () => {
  state.customTemplate = CUSTOM_TEMPLATE_DEFAULT;
  writeCustomTemplate(state.customTemplate);
  syncFormatControls();
  renderResult();
  setStatus("已恢复默认模板");
});

copyFormatControls?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-copy-format]");
  if (!button) {
    return;
  }
  const nextFormat = button.dataset.copyFormat;
  if (!COPY_FORMATS.has(nextFormat) || state.copyFormat === nextFormat) {
    return;
  }
  state.copyFormat = nextFormat;
  writeCopyFormat(nextFormat);
  syncFormatControls();
  renderResult();
});

function syncEquipmentToStore() {
  if (_storeIgnoreSync) { return; }
  if (state.parsed?.resolved_equipment?.length) {
    const payload = NSGlamourStore.equipmentSync.makeParsedPayload(state.parsed, {
      locale: state.locale,
      displayName: state.displayName,
    });
    _storeIgnoreSync = true;
    try {
      NSGlamourStore.equipment.set(payload);
    } finally {
      _storeIgnoreSync = false;
    }
  }
}

NSGlamourStore.on("equipment:changed", (data) => {
  if (_storeIgnoreSync || !NSGlamourStore.equipmentSync.isPayload(data)) { return; }
  _storeIgnoreSync = true;
  const parsed = NSGlamourStore.equipmentSync.getParsedPayload(data, { getCandidateName });
  if (parsed?.resolved_equipment?.length) {
    try {
      acceptPayload(parsed, {
        displayName: NSGlamourStore.equipmentSync.getDisplayName(data),
        render: false,
        syncStore: false,
      });
      const storeLocale = NSGlamourStore.equipmentSync.getLocale(data);
      if (storeLocale) state.locale = getAvailableEquipinfoLocale(storeLocale);
      setEquipinfoLocale(state.locale, { syncStore: false }).finally(() => {
        _storeIgnoreSync = false;
      });
    } catch {
      _storeIgnoreSync = false;
    }
  } else {
    _storeIgnoreSync = false;
  }
});

window.addEventListener("nsglamour:ui-language-change", (event) => {
  const locale = getEquipinfoLocaleForUiLanguage(event.detail?.language);
  if (!locale) {
    window.NSGlamourUiLanguage?.refresh?.();
    return;
  }
  state.locale = getAvailableEquipinfoLocale(locale);
  if (!equipinfoInitialized) {
    return;
  }
  setEquipinfoLocale(state.locale);
});

function readTemplateDraftFallback() {
  try {
    const draft = JSON.parse(localStorage.getItem(CARD_DRAFT_KEY) || "null");
    if (!draft?.entries?.length) {
      return null;
    }
    const parsed = NSGlamourStore.equipmentSync.draftToParsedPayload(draft, { getCandidateName });
    if (!parsed?.resolved_equipment?.length) {
      return null;
    }
    return {
      parsed,
      displayName: normalizeConfigName(draft.sourceName || parsed.source_name || ""),
      locale: draft.locale || parsed.source_locale || parsed.default_locale || "",
    };
  } catch {
    return null;
  }
}

state.copyFormat = readCopyFormat();
state.customTemplate = readCustomTemplate();
loadTheme();
populateSourceLocales();
updateTextLineNumbers();

async function initFromSharedEquipment() {
  // Pull equipment from store (from template page or previous session)
  const equipStoreData = NSGlamourStore.equipment.get();
  let equipLoadedFromStore = false;
  if (NSGlamourStore.equipmentSync.isPayload(equipStoreData)) {
    const parsed = NSGlamourStore.equipmentSync.getParsedPayload(equipStoreData, { getCandidateName });
    if (parsed?.resolved_equipment?.length) {
      const storeLocale = NSGlamourStore.equipmentSync.getLocale(equipStoreData);
      if (storeLocale) parsed.source_locale = storeLocale;
      acceptPayload(parsed, {
        displayName: NSGlamourStore.equipmentSync.getDisplayName(equipStoreData),
        render: false,
        syncStore: false,
      });
      if (storeLocale) state.locale = storeLocale;
      equipLoadedFromStore = true;
    }
  }

  if (!equipLoadedFromStore) {
    const draftFallback = readTemplateDraftFallback();
    if (draftFallback) {
      if (draftFallback.locale) draftFallback.parsed.source_locale = draftFallback.locale;
      acceptPayload(draftFallback.parsed, {
        displayName: draftFallback.displayName,
        render: false,
        syncStore: true,
        clearStatus: false,
      });
      if (draftFallback.locale) state.locale = draftFallback.locale;
      equipLoadedFromStore = true;
    }
  }

  if (!equipLoadedFromStore) state.parsed = createEmptyParsedPayload();
}

initFromSharedEquipment().finally(() => {
  const uiLocale = getEquipinfoLocaleForUiLanguage();
  if (uiLocale) {
    state.locale = getAvailableEquipinfoLocale(uiLocale);
  }
  setEquipinfoLocale(state.locale, { syncStore: false }).finally(() => {
    equipinfoInitialized = true;
  });
});
