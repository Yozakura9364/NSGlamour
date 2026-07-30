(() => {
  const snapshotId = String(window.NSGLAMOUR_SNAPSHOT_ID || "");
  const status = document.getElementById("snapshotStatus");
  const languageControls = document.getElementById("snapshotLanguageControls");
  const slotGrid = document.getElementById("snapshotSlotGrid");
  const localeOrder = ["ja", "en", "fr", "de", "zh", "tc", "ko"];
  const localeLabels = { ja: "ja", en: "en", fr: "fr", de: "de", zh: "chs", tc: "tc", ko: "ko" };
  const localeHtmlLang = { zh: "zh-CN", tc: "zh-TW", en: "en", ja: "ja", ko: "ko", fr: "fr", de: "de" };
  const leftSlots = ["MainHand", "HeadGear", "Body", "Hands", "Legs", "Feet", "Glasses"];
  const rightSlots = ["OffHand", "Ears", "Neck", "Wrists", "LeftRing", "RightRing", "FashionAccessory"];
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

  function renderLanguages() {
    languageControls.replaceChildren();
    const locales = localeOrder.filter((value) => snapshot.locales.includes(value));
    locales.forEach((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("active", value === locale);
      button.textContent = localeLabels[value] || value;
      button.addEventListener("click", () => {
        locale = value;
        renderLanguages();
        renderEquipment();
      });
      languageControls.appendChild(button);
    });
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

  function createColumn(entriesBySlot, slots) {
    const column = document.createElement("div");
    column.className = "equipinfo-slot-column";
    slots.forEach((slot) => {
      const entry = entriesBySlot.get(slot);
      if (entry) {
        column.appendChild(createEquipmentRow(entry));
      }
    });
    return column;
  }

  function renderEquipment() {
    const entriesBySlot = new Map(snapshot.entries.map((entry) => [entry.slot, entry]));
    slotGrid.replaceChildren(
      createColumn(entriesBySlot, leftSlots),
      createColumn(entriesBySlot, rightSlots),
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
      locale = snapshot.locales.includes("zh") ? "zh" : snapshot.locales[0] || "zh";
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
