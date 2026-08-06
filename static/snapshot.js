(() => {
  const snapshotId = String(window.NSGLAMOUR_SNAPSHOT_ID || "");
  const status = document.getElementById("snapshotStatus");
  const layoutToggleButton = document.getElementById("snapshotLayoutToggleButton");
  const layoutToggleIcon = document.getElementById("snapshotLayoutToggleIcon");
  const languageControl = document.getElementById("snapshotLanguageControl");
  const languageButton = document.getElementById("snapshotLanguageButton");
  const languageMenu = document.getElementById("snapshotLanguageMenu");
  const themeToggleButton = document.getElementById("themeToggleBtn");
  const slotGrid = document.getElementById("snapshotSlotGrid");
  const layoutApi = window.NSGlamourSnapshotLayout;
  const layoutStorageKey = "nsglamour.snapshotLayout";
  const localeOrder = ["ja", "en", "fr", "de", "zh", "tc", "ko"];
  const localeLabels = {
    ja: "日本語",
    en: "English",
    fr: "Français",
    de: "Deutsch",
    zh: "简体中文",
    tc: "繁體中文",
    ko: "한국어",
  };
  const localeHtmlLang = { zh: "zh-CN", tc: "zh-TW", en: "en", ja: "ja", ko: "ko", fr: "fr", de: "de" };
  const localeUrlValues = { zh: "zh-CN", tc: "zh-TW", en: "en", ja: "ja", ko: "ko", fr: "fr", de: "de" };
  const urlLocaleAliases = new Map([
    ["ja", "ja"],
    ["en", "en"],
    ["fr", "fr"],
    ["de", "de"],
    ["zh", "zh"],
    ["zh-cn", "zh"],
    ["chs", "zh"],
    ["tc", "tc"],
    ["zh-tw", "tc"],
    ["ko", "ko"],
  ]);
  const equipmentSlotOrder = [
    "MainHand",
    "OffHand",
    "HeadGear",
    "Body",
    "Hands",
    "Legs",
    "Feet",
    "Ears",
    "Neck",
    "Wrists",
    "LeftRing",
    "RightRing",
    "Glasses",
    "FashionAccessory",
  ];
  let snapshot = null;
  let locale = "zh";
  let layoutMode = readLayoutMode();

  function appPath(path) {
    return window.NSGlamourCommon.appPath(path);
  }

  function readLayoutMode() {
    try {
      return layoutApi.normalizeMode(localStorage.getItem(layoutStorageKey));
    } catch {
      return layoutApi.COMPACT_MODE;
    }
  }

  function saveLayoutMode() {
    try {
      localStorage.setItem(layoutStorageKey, layoutMode);
    } catch {
      // The viewer still works when browser storage is unavailable.
    }
  }

  function resolveLocalized(names, selectedLocale = locale) {
    if (!names || typeof names !== "object") {
      return "";
    }
    return names[selectedLocale] || names.zh || names.en || Object.values(names).find(Boolean) || "";
  }

  function getRequestedLocale() {
    const value = new URLSearchParams(window.location.search).get("lang");
    return urlLocaleAliases.get(String(value || "").trim().toLowerCase()) || "";
  }

  function updateUrlLocale(nextLocale) {
    const value = localeUrlValues[nextLocale];
    if (!value) return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", value);
    window.history.replaceState(null, "", url);
  }

  function setLanguageMenuOpen(open) {
    languageMenu.classList.toggle("hidden", !open);
    languageMenu.setAttribute("aria-hidden", String(!open));
    languageButton.setAttribute("aria-expanded", String(open));
  }

  function renderLanguages() {
    languageMenu.replaceChildren();
    const locales = localeOrder.filter((value) => snapshot.locales.includes(value));
    const currentLabel = localeLabels[locale] || locale;
    languageButton.title = `语言：${currentLabel}`;
    languageButton.setAttribute("aria-label", `语言：${currentLabel}`);
    locales.forEach((value) => {
      const option = document.createElement("button");
      option.type = "button";
      option.lang = localeHtmlLang[value] || value;
      option.textContent = localeLabels[value] || value;
      option.classList.toggle("active", value === locale);
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", String(value === locale));
      option.addEventListener("click", () => {
        locale = value;
        updateUrlLocale(locale);
        setLanguageMenuOpen(false);
        renderLanguages();
        renderEquipment();
        languageButton.focus();
      });
      languageMenu.appendChild(option);
    });
  }

  function updateLayoutControl() {
    const isSpacious = layoutMode === layoutApi.SPACIOUS_MODE;
    const currentLabel = isSpacious ? "宽松布局" : "紧凑布局";
    const nextLabel = isSpacious ? "紧凑布局" : "宽松布局";
    layoutToggleIcon.classList.toggle("is-spacious", isSpacious);
    layoutToggleButton.title = `当前为${currentLabel}，切换为${nextLabel}`;
    layoutToggleButton.setAttribute("aria-label", `当前为${currentLabel}，切换为${nextLabel}`);
    layoutToggleButton.setAttribute("aria-pressed", String(isSpacious));
  }

  function createDyeChip(dye) {
    const wrapper = document.createElement("div");
    wrapper.className = "editor-dye-select";
    const chip = document.createElement("span");
    chip.className = "dye-picker-button equipinfo-dye-chip";
    chip.classList.toggle("empty-dye", Boolean(dye.isEmpty));
    chip.style.setProperty("--dye-color", dye.hex || "transparent");
    chip.textContent = resolveLocalized(dye.names) || dye.name || resolveLocalized(snapshot.no_dye_labels);
    wrapper.appendChild(chip);
    return wrapper;
  }

  function createEquipmentRow(entry) {
    const row = document.createElement("article");
    row.className = "editor-row";
    const slotName = document.createElement("h3");
    slotName.className = "editor-slot-name";
    slotName.lang = localeHtmlLang[locale] || locale;
    slotName.textContent = resolveLocalized(entry.slot_names)
      || resolveLocalized(snapshot.slot_names[entry.slot])
      || resolveLocalized(window.NSGlamourCommon.getSlotNames(entry.slot));

    const itemBox = document.createElement("div");
    itemBox.className = "editor-item";
    if (!entry.item) {
      row.classList.add("snapshot-empty-row");
      itemBox.setAttribute("aria-hidden", "true");
      row.append(slotName, itemBox);
      return row;
    }

    const iconUrl = window.NSGlamourCommon.buildIconUrl(entry.item.icon);
    if (iconUrl) {
      const icon = document.createElement("img");
      icon.className = "editor-item-icon";
      icon.src = iconUrl;
      icon.alt = "";
      icon.loading = "lazy";
      icon.referrerPolicy = "no-referrer";
      icon.addEventListener("error", () => icon.remove());
      itemBox.appendChild(icon);
    }

    const body = document.createElement("div");
    body.className = "editor-item-body";
    const title = document.createElement("div");
    title.className = "editor-item-title";
    const name = document.createElement("strong");
    name.lang = localeHtmlLang[locale] || locale;
    name.textContent = resolveLocalized(entry.item.names) || entry.item.name;
    title.appendChild(name);
    body.appendChild(title);
    if (Array.isArray(entry.item.dyes) && entry.item.dyes.length) {
      const dyes = document.createElement("div");
      dyes.className = "editor-dye-controls";
      entry.item.dyes.forEach((dye) => dyes.appendChild(createDyeChip(dye)));
      body.appendChild(dyes);
    }
    itemBox.appendChild(body);
    window.NSGlamourItemReferenceMenu.attach(itemBox, entry.item);
    row.append(slotName, itemBox);
    return row;
  }

  function createColumn(entries) {
    const column = document.createElement("div");
    column.className = "equipinfo-slot-column";
    entries.forEach((entry) => column.appendChild(createEquipmentRow(entry)));
    return column;
  }

  function renderEquipment() {
    const entries = layoutApi.buildEntries(
      snapshot.entries,
      snapshot.slot_names,
      layoutMode,
      equipmentSlotOrder,
    );
    const columns = layoutApi.splitEntries(entries);
    slotGrid.classList.toggle("single-column", columns.length === 1);
    slotGrid.classList.toggle("spacious-layout", layoutMode === layoutApi.SPACIOUS_MODE);
    slotGrid.replaceChildren(...columns.map(createColumn));
  }

  async function loadSnapshot() {
    try {
      const response = await fetch(appPath(`/api/equipinfo/snapshots/${encodeURIComponent(snapshotId)}`), {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      snapshot = data.snapshot;
      const requestedLocale = getRequestedLocale();
      locale = requestedLocale && snapshot.locales.includes(requestedLocale)
        ? requestedLocale
        : snapshot.locales.includes("zh") ? "zh" : snapshot.locales[0] || "zh";
      status.hidden = true;
      renderLanguages();
      renderEquipment();
    } catch {
      status.textContent = "快照读取失败";
    }
  }

  layoutToggleButton.addEventListener("click", () => {
    layoutMode = layoutMode === layoutApi.COMPACT_MODE
      ? layoutApi.SPACIOUS_MODE
      : layoutApi.COMPACT_MODE;
    saveLayoutMode();
    updateLayoutControl();
    if (snapshot) renderEquipment();
  });

  languageButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setLanguageMenuOpen(languageMenu.classList.contains("hidden"));
  });

  themeToggleButton.addEventListener("click", () => {
    setLanguageMenuOpen(false);
    window.NSGlamourCommon.toggleTheme();
  });

  document.addEventListener("click", (event) => {
    if (!languageControl.contains(event.target)) {
      setLanguageMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !languageMenu.classList.contains("hidden")) {
      setLanguageMenuOpen(false);
      languageButton.focus();
    }
  });

  window.NSGlamourCommon.setupThemeListeners();
  window.NSGlamourCommon.loadTheme();
  updateLayoutControl();
  loadSnapshot();
})();
