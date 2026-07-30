(() => {
  const snapshotId = String(window.NSGLAMOUR_SNAPSHOT_ID || "");
  const status = document.getElementById("snapshotStatus");
  const languageControls = document.getElementById("snapshotLanguageControls");
  const slotGrid = document.getElementById("snapshotSlotGrid");
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
  const equipmentSlotRanks = new Map(equipmentSlotOrder.map((slot, index) => [slot, index]));
  let snapshot = null;
  let locale = "zh";

  function appPath(path) {
    return window.NSGlamourCommon.appPath(path);
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

  function renderLanguages() {
    languageControls.replaceChildren();
    const locales = localeOrder.filter((value) => snapshot.locales.includes(value));
    const select = document.createElement("select");
    select.className = "snapshot-language-select";
    select.setAttribute("aria-label", "装备名语言");
    locales.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.lang = localeHtmlLang[value] || value;
      option.textContent = localeLabels[value] || value;
      select.appendChild(option);
    });
    select.value = locale;
    select.addEventListener("change", () => {
      locale = select.value;
      updateUrlLocale(locale);
      renderEquipment();
    });
    languageControls.appendChild(select);
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
    slotName.textContent = resolveLocalized(entry.slot_names) || resolveLocalized(snapshot.slot_names[entry.slot]);

    const itemBox = document.createElement("div");
    itemBox.className = "editor-item";
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
    const entries = [...snapshot.entries].sort((left, right) => (
      (equipmentSlotRanks.get(left.slot) ?? equipmentSlotOrder.length)
      - (equipmentSlotRanks.get(right.slot) ?? equipmentSlotOrder.length)
    ));
    const isSingleColumn = entries.length <= 5;
    slotGrid.classList.toggle("single-column", isSingleColumn);
    if (isSingleColumn) {
      slotGrid.replaceChildren(createColumn(entries));
      return;
    }
    const splitAt = Math.ceil(entries.length / 2);
    slotGrid.replaceChildren(
      createColumn(entries.slice(0, splitAt)),
      createColumn(entries.slice(splitAt)),
    );
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

  window.NSGlamourCommon.loadTheme();
  loadSnapshot();
})();
