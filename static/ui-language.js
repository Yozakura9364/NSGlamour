const UI_LANGUAGE_KEY = "nsglamour.uiLanguage";
const UI_LANGUAGE_MANUAL_KEY = "nsglamour.uiLanguage.manual";
const UI_LANGUAGE_OPTIONS = [
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];
const UI_LOCALIZATION_URL = appPathForUiLanguage("/api/ui-localization");
const UI_TRANSLATED_ATTRS = ["title", "aria-label", "placeholder"];
const UI_I18N_ORIGINAL_ATTR = "data-ui-i18n-original";
const UI_I18N_RENDERED_ATTR = "data-ui-i18n-rendered";
const UI_I18N_ATTR_PREFIX = "data-ui-i18n-original-";
const UI_I18N_SKIP_SELECTOR = "[data-ui-i18n-skip]";
const UI_I18N_SKIP_TEXT_SELECTOR = "[data-ui-i18n-skip], [data-ui-i18n-skip-text]";
const UI_ORIGINAL_TITLE_ATTR = "data-ui-i18n-original-title";

let uiLocalizationPromise = null;
let uiLocalizationStrings = {};
let uiLocalizationByZh = new Map();
let uiLocalizationObserver = null;
let uiLocalizationApplying = false;
let currentUiLanguage = "";
let uiLanguageInitPromise = null;

function appPathForUiLanguage(path) {
  const normalized = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  const scriptUrl = document.currentScript?.src || "";
  if (!scriptUrl) {
    return normalized;
  }
  try {
    const pathname = new URL(scriptUrl).pathname;
    const staticIndex = pathname.indexOf("/static/");
    const basePath = staticIndex > 0 ? pathname.slice(0, staticIndex) : "";
    return `${basePath}${normalized}`;
  } catch {
    return normalized;
  }
}

function matchUiLanguage(value) {
  const raw = String(value || "").trim();
  const normalized = raw.replace(/_/g, "-").toLowerCase();
  if (!normalized) {
    return "";
  }
  if (
    normalized === "zh" ||
    normalized === "chs" ||
    /^zh-(cn|sg|hans)(?:-|$)/i.test(normalized)
  ) {
    return "zh-CN";
  }
  if (
    normalized === "tc" ||
    normalized === "cht" ||
    /^zh-(tw|hk|mo|hant)(?:-|$)/i.test(normalized)
  ) {
    return "zh-TW";
  }
  const matched = UI_LANGUAGE_OPTIONS.find((option) => {
    const code = option.code.toLowerCase();
    return code === normalized || normalized.startsWith(`${code}-`);
  });
  return matched ? matched.code : "";
}

function normalizeUiLanguage(value) {
  return matchUiLanguage(value) || "zh-CN";
}

function getSystemUiLanguage() {
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
    navigator.userLanguage,
  ];
  for (const candidate of candidates) {
    const matched = matchUiLanguage(candidate);
    if (matched) {
      return matched;
    }
  }
  return "zh-CN";
}

function hasManualUiLanguagePreference() {
  return localStorage.getItem(UI_LANGUAGE_MANUAL_KEY) === "1";
}

function getInitialUiLanguage() {
  const stored = localStorage.getItem(UI_LANGUAGE_KEY);
  if (stored && hasManualUiLanguagePreference()) {
    return normalizeUiLanguage(stored);
  }
  return getSystemUiLanguage();
}

function getStoredUiLanguage() {
  return currentUiLanguage || getInitialUiLanguage();
}

function getUiLanguageLabel(language) {
  return UI_LANGUAGE_OPTIONS.find((option) => option.code === language)?.label || language;
}

function resolveUiLocalizationEntry(entry, seen = new Set()) {
  if (!entry?.aliasOf) {
    return entry || null;
  }
  const targetKey = String(entry.aliasOf || "");
  if (!targetKey || seen.has(targetKey)) {
    return entry;
  }
  seen.add(targetKey);
  return resolveUiLocalizationEntry(uiLocalizationStrings[targetKey], seen) || entry;
}

function getUiLocalizedValue(entry, language) {
  const resolvedEntry = resolveUiLocalizationEntry(entry);
  if (!resolvedEntry) {
    return "";
  }
  return resolvedEntry[language] || resolvedEntry["zh-CN"] || "";
}

function buildUiLocalizationIndex(strings) {
  const byZh = new Map();
  Object.entries(strings || {}).forEach(([key, entry]) => {
    const resolvedEntry = resolveUiLocalizationEntry(entry);
    const zh = String(resolvedEntry?.["zh-CN"] || "");
    if (!zh || !resolvedEntry) {
      return;
    }
    byZh.set(zh, { key, entry: resolvedEntry });
  });
  return byZh;
}

function loadUiLocalization() {
  if (!uiLocalizationPromise) {
    uiLocalizationPromise = fetch(UI_LOCALIZATION_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        uiLocalizationStrings = data?.strings || {};
        uiLocalizationByZh = buildUiLocalizationIndex(uiLocalizationStrings);
        return data;
      })
      .catch(() => {
        uiLocalizationStrings = {};
        uiLocalizationByZh = new Map();
        return null;
      });
  }
  return uiLocalizationPromise;
}

function getUiEntryByKey(key) {
  return key ? resolveUiLocalizationEntry(uiLocalizationStrings[key]) : null;
}

function getUiEntryByText(text) {
  const value = String(text || "").trim();
  if (!value) {
    return null;
  }
  return uiLocalizationByZh.get(value)?.entry || null;
}

function escapeUiRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildUiTemplateRegex(source) {
  const parts = String(source || "").split(/(\{[^{}]+\})/g).filter((part) => part !== "");
  if (!parts.some((part) => /^\{[^{}]+\}$/.test(part))) {
    return null;
  }
  const pattern = parts
    .map((part) => (/^\{[^{}]+\}$/.test(part) ? "([\\s\\S]+?)" : escapeUiRegex(part)))
    .join("");
  return new RegExp(`^${pattern}$`);
}

function translateUiTemplateText(text, language) {
  for (const { entry } of uiLocalizationByZh.values()) {
    const source = String(entry?.["zh-CN"] || "");
    const localized = getUiLocalizedValue(entry, language);
    if (!source || !localized || localized === source) {
      continue;
    }
    const regex = buildUiTemplateRegex(source);
    if (!regex) {
      continue;
    }
    const match = String(text || "").match(regex);
    if (!match) {
      continue;
    }
    let index = 1;
    return localized.replace(/\{[^{}]+\}/g, () => match[index++] || "");
  }
  return "";
}

function translateUiText(value, language) {
  const text = String(value || "");
  if (!text.trim()) {
    return text;
  }
  const exact = getUiEntryByText(text);
  const exactValue = getUiLocalizedValue(exact, language);
  if (exactValue) {
    return exactValue;
  }
  const templatedValue = translateUiTemplateText(text, language);
  if (templatedValue) {
    return templatedValue;
  }

  let bestSource = "";
  let bestLocalized = "";
  for (const { entry } of uiLocalizationByZh.values()) {
    const source = String(entry?.["zh-CN"] || "");
    if (!source || source.length < 2 || !text.includes(source)) {
      continue;
    }
    if (bestSource && source.length <= bestSource.length) {
      continue;
    }
    const localized = getUiLocalizedValue(entry, language);
    if (localized && localized !== source) {
      bestSource = source;
      bestLocalized = localized;
    }
  }
  if (bestSource) {
    return text.split(bestSource).join(bestLocalized);
  }
  return text;
}

function localizeUiElementText(element, language) {
  if (
    !element ||
    ["SCRIPT", "STYLE", "TEMPLATE"].includes(element.tagName) ||
    element.closest?.("[data-ui-lang]") ||
    element.closest?.(UI_I18N_SKIP_TEXT_SELECTOR)
  ) {
    return;
  }

  const key = element.dataset?.i18nKey || element.dataset?.uiI18nKey || "";
  const keyedEntry = getUiEntryByKey(key);
  if (keyedEntry) {
    if (!element.hasAttribute(UI_I18N_ORIGINAL_ATTR)) {
      element.setAttribute(UI_I18N_ORIGINAL_ATTR, element.textContent || "");
    }
    const localized = getUiLocalizedValue(keyedEntry, language);
    if (localized && element.textContent !== localized) {
      element.textContent = localized;
    }
    element.setAttribute(UI_I18N_RENDERED_ATTR, localized || element.textContent || "");
    return;
  }

  if (element.children.length || !element.textContent.trim()) {
    return;
  }
  if (!element.hasAttribute(UI_I18N_ORIGINAL_ATTR)) {
    element.setAttribute(UI_I18N_ORIGINAL_ATTR, element.textContent);
  }
  let original = element.getAttribute(UI_I18N_ORIGINAL_ATTR) || "";
  const previousRendered = element.getAttribute(UI_I18N_RENDERED_ATTR) || "";
  if (
    previousRendered &&
    element.textContent !== previousRendered &&
    element.textContent !== original
  ) {
    original = element.textContent;
    element.setAttribute(UI_I18N_ORIGINAL_ATTR, original);
  }
  const localized = translateUiText(original, language);
  if (element.textContent !== localized) {
    element.textContent = localized;
  }
  element.setAttribute(UI_I18N_RENDERED_ATTR, localized);
}

function localizeUiElementAttrs(element, language) {
  if (!element || ["SCRIPT", "STYLE", "TEMPLATE"].includes(element.tagName) || element.closest?.(UI_I18N_SKIP_SELECTOR)) {
    return;
  }
  UI_TRANSLATED_ATTRS.forEach((attr) => {
    if (!element.hasAttribute(attr)) {
      return;
    }
    const storageAttr = `${UI_I18N_ATTR_PREFIX}${attr}`;
    if (!element.hasAttribute(storageAttr)) {
      element.setAttribute(storageAttr, element.getAttribute(attr) || "");
    }
    const original = element.getAttribute(storageAttr) || "";
    const localized = translateUiText(original, language);
    if (element.getAttribute(attr) !== localized) {
      element.setAttribute(attr, localized);
    }
  });
}

function applyUiLocalizationTo(root, language) {
  if (!root || !uiLocalizationByZh.size) {
    return;
  }
  const normalized = normalizeUiLanguage(language);
  if (root === document.body && document.title) {
    if (!document.documentElement.hasAttribute(UI_ORIGINAL_TITLE_ATTR)) {
      document.documentElement.setAttribute(UI_ORIGINAL_TITLE_ATTR, document.title);
    }
    const originalTitle = document.documentElement.getAttribute(UI_ORIGINAL_TITLE_ATTR) || document.title;
    document.title = translateUiText(originalTitle, normalized);
  }
  const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll("*")] : [];
  elements.forEach((element) => {
    localizeUiElementAttrs(element, normalized);
    localizeUiElementText(element, normalized);
  });
}

function bindUiLocalizationObserver() {
  if (uiLocalizationObserver || !document.body) {
    return;
  }
  uiLocalizationObserver = new MutationObserver((mutations) => {
    if (uiLocalizationApplying) {
      return;
    }
    const language = getStoredUiLanguage();
    uiLocalizationApplying = true;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          applyUiLocalizationTo(node, language);
        }
      });
      if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        if (parent && !parent.closest?.(UI_I18N_SKIP_TEXT_SELECTOR) && !parent.children.length) {
          const original = parent.getAttribute(UI_I18N_ORIGINAL_ATTR) || "";
          const rendered = parent.getAttribute(UI_I18N_RENDERED_ATTR) || "";
          const currentText = parent.textContent || "";
          if (rendered && currentText === rendered) {
            return;
          }
          if (original && currentText !== original) {
            parent.removeAttribute(UI_I18N_ORIGINAL_ATTR);
            parent.removeAttribute(UI_I18N_RENDERED_ATTR);
          }
          localizeUiElementText(parent, language);
        }
      }
      if (mutation.type === "attributes") {
        localizeUiElementAttrs(mutation.target, language);
      }
    });
    uiLocalizationApplying = false;
  });
  uiLocalizationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: UI_TRANSLATED_ATTRS,
  });
}

async function applyUiLanguage(language, options = {}) {
  const normalized = normalizeUiLanguage(language);
  const shouldPersist = options.persist ?? true;
  const isManual = options.manual ?? shouldPersist;
  currentUiLanguage = normalized;
  document.documentElement.lang = normalized;
  if (shouldPersist) {
    localStorage.setItem(UI_LANGUAGE_KEY, normalized);
    if (isManual) {
      localStorage.setItem(UI_LANGUAGE_MANUAL_KEY, "1");
    }
  }
  document.querySelectorAll("[data-ui-lang]").forEach((button) => {
    const isCurrent = button.dataset.uiLang === normalized;
    button.classList.toggle("active", isCurrent);
    button.setAttribute("aria-checked", isCurrent ? "true" : "false");
  });
  document.querySelectorAll("[data-ui-language-current]").forEach((element) => {
    element.textContent = getUiLanguageLabel(normalized);
  });

  await loadUiLocalization();
  uiLocalizationApplying = true;
  applyUiLocalizationTo(document.body, normalized);
  uiLocalizationApplying = false;
  bindUiLocalizationObserver();
  window.dispatchEvent(new CustomEvent("nsglamour:ui-language-change", { detail: { language: normalized } }));
}

function closeUiLanguageMenu() {
  let closedAny = false;
  document.querySelectorAll("[data-ui-language-menu]").forEach((menu) => {
    if (!menu.classList.contains("hidden")) {
      closedAny = true;
    }
    menu.classList.add("hidden");
    menu.setAttribute("aria-hidden", "true");
  });
  document.querySelectorAll("[data-ui-language-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
  if (closedAny) {
    window.dispatchEvent(new CustomEvent("nsglamour:header-popover-close", { detail: { source: "language" } }));
  }
}

function bindUiLanguageMenu() {
  const toggle = document.querySelector("[data-ui-language-toggle]");
  const menu = document.querySelector("[data-ui-language-menu]");
  if (!toggle || !menu) {
    ensureInitialUiLanguageApplied();
    return;
  }

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = menu.classList.contains("hidden");
    closeUiLanguageMenu();
    if (willOpen) {
      menu.classList.remove("hidden");
      menu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      window.dispatchEvent(new CustomEvent("nsglamour:header-popover-open", { detail: { source: "language" } }));
    }
  });

  menu.addEventListener("click", (event) => {
    event.stopPropagation();
    const option = event.target.closest("[data-ui-lang]");
    if (!option) {
      return;
    }
    applyUiLanguage(option.dataset.uiLang, { persist: true, manual: true });
    closeUiLanguageMenu();
  });

  document.addEventListener("click", closeUiLanguageMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeUiLanguageMenu();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === UI_LANGUAGE_KEY) {
      if (event.newValue === null) {
        return;
      }
      applyUiLanguage(event.newValue, { persist: false, manual: false });
    }
  });
  ensureInitialUiLanguageApplied();
}

function ensureInitialUiLanguageApplied() {
  if (!uiLanguageInitPromise) {
    uiLanguageInitPromise = applyUiLanguage(getInitialUiLanguage(), { persist: false, manual: false });
  }
  return uiLanguageInitPromise;
}

function readyUiLanguage() {
  return ensureInitialUiLanguageApplied().then(() => loadUiLocalization());
}

window.NSGlamourUiLanguage = {
  apply: applyUiLanguage,
  get: getStoredUiLanguage,
  system: getSystemUiLanguage,
  normalize: normalizeUiLanguage,
  ready: readyUiLanguage,
  closeMenu: closeUiLanguageMenu,
  refresh: (root = document.body) => {
    loadUiLocalization().then(() => {
      uiLocalizationApplying = true;
      applyUiLocalizationTo(root, getStoredUiLanguage());
      uiLocalizationApplying = false;
    });
  },
  translate: (value, language = getStoredUiLanguage()) => translateUiText(value, normalizeUiLanguage(language)),
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindUiLanguageMenu);
} else {
  bindUiLanguageMenu();
}
