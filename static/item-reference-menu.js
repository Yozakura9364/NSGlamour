(() => {
  const LONG_PRESS_MS = 650;
  const LONG_PRESS_MOVE_TOLERANCE = 12;
  const VIEWPORT_MARGIN = 8;
  const LODESTONE_MAP_PATH = "/data/ffxiv/lodestone-id-map.json";
  const LODESTONE_ITEM_PREFIX = "https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/";
  const LODESTONE_SEARCH_PREFIX = "https://jp.finalfantasyxiv.com/lodestone/playguide/db/search/";
  const GARLAND_ITEM_PREFIX = "https://www.garlandtools.cn/db/#item/";
  const HUIJI_ITEM_PREFIX = "https://ff14.huijiwiki.com/wiki/物品:";
  const KR_GUIDE_SEARCH_PREFIX = "https://guide.ff14.co.kr/lodestone/search";
  const menuEntries = [
    {
      key: "huiji",
      label: "最终幻想14中文维基",
      icon: "huiji.svg",
    },
    {
      key: "lodestone",
      label: "Lodestone",
      icon: "lodestone.ico",
    },
    {
      key: "garland",
      label: "Garland Data",
      icon: "garland-data.ico",
    },
    {
      key: "krGuide",
      label: "파이널판타지14 공식 가이드",
      icon: "ffxiv-kr-guide.ico",
    },
  ];

  let menu = null;
  let lodestoneMapPromise = null;

  function appPath(path) {
    return window.NSGlamourCommon.appPath(path);
  }

  function itemName(item, selectedLocale, fallbacks = []) {
    const names = item?.names && typeof item.names === "object" ? item.names : {};
    return String(
      names[selectedLocale]
      || fallbacks.map((locale) => names[locale]).find(Boolean)
      || item?.name
      || "",
    ).trim();
  }

  function stripNameSuffix(value) {
    return String(value || "").replace(/\s*[:：]\s*.+$/, "").trim();
  }

  function lodestoneSearchUrl(name) {
    return `${LODESTONE_SEARCH_PREFIX}?q=${encodeURIComponent(name)}`;
  }

  function loadLodestoneMap() {
    if (!lodestoneMapPromise) {
      lodestoneMapPromise = fetch(LODESTONE_MAP_PATH, { cache: "force-cache" })
        .then((response) => response.ok ? response.json() : {})
        .catch(() => ({}));
    }
    return lodestoneMapPromise;
  }

  function buildUrls(item) {
    const itemId = Number(item?.key);
    const zhName = itemName(item, "zh", ["tc", "ja", "en"]);
    const lodestoneName = itemName(item, "ja", ["en", "zh"]);
    const koName = stripNameSuffix(itemName(item, "ko", ["zh", "en"]));
    return {
      huiji: `${HUIJI_ITEM_PREFIX}${encodeURIComponent(zhName)}`,
      lodestone: lodestoneSearchUrl(lodestoneName),
      garland: `${GARLAND_ITEM_PREFIX}${itemId}`,
      krGuide: `${KR_GUIDE_SEARCH_PREFIX}?keyword=${encodeURIComponent(koName)}`,
    };
  }

  function hideMenu() {
    if (!menu) return;
    menu.hidden = true;
    menu.replaceChildren();
    menu.removeAttribute("data-item-id");
  }

  function positionMenu(clientX, clientY) {
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
    menu.style.left = `${Math.min(Math.max(VIEWPORT_MARGIN, clientX), maxX)}px`;
    menu.style.top = `${Math.min(Math.max(VIEWPORT_MARGIN, clientY), maxY)}px`;
  }

  function ensureMenu() {
    if (menu) return menu;
    menu = document.createElement("div");
    menu.className = "snapshot-item-reference-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    document.body.appendChild(menu);

    window.addEventListener("scroll", hideMenu, true);
    window.addEventListener("resize", hideMenu);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hideMenu();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!menu.hidden && !menu.contains(event.target)) hideMenu();
    }, true);
    return menu;
  }

  function createLink(entry, href) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("role", "menuitem");
    link.dataset.site = entry.key;

    const icon = document.createElement("img");
    icon.src = appPath(`/static/icons/item-reference/${entry.icon}`);
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    link.append(icon, document.createTextNode(entry.label));
    link.addEventListener("click", hideMenu);
    return link;
  }

  function updateExactLodestoneUrl(itemId) {
    loadLodestoneMap().then((map) => {
      if (!menu || menu.hidden || menu.dataset.itemId !== String(itemId)) return;
      const hash = map[String(itemId)];
      const link = menu.querySelector('[data-site="lodestone"]');
      if (hash && link) {
        link.href = `${LODESTONE_ITEM_PREFIX}${hash}/`;
      }
    });
  }

  function openMenu(item, clientX, clientY) {
    const itemId = Number(item?.key);
    if (!Number.isInteger(itemId) || itemId <= 0) return;

    const urls = buildUrls(item);
    const targetMenu = ensureMenu();
    targetMenu.dataset.itemId = String(itemId);
    targetMenu.replaceChildren(...menuEntries.map((entry) => createLink(entry, urls[entry.key])));
    targetMenu.hidden = false;
    positionMenu(clientX, clientY);
    updateExactLodestoneUrl(itemId);
  }

  function attach(element, item) {
    if (!(element instanceof HTMLElement) || element.dataset.itemReferenceAttached === "true") return;
    element.dataset.itemReferenceAttached = "true";
    element.classList.add("snapshot-item-reference-target");
    let longPressState = null;

    function cancelLongPress() {
      if (!longPressState) return;
      window.clearTimeout(longPressState.timer);
      longPressState = null;
    }

    element.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      cancelLongPress();
      openMenu(item, event.clientX, event.clientY);
    });

    element.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      cancelLongPress();
      longPressState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        timer: window.setTimeout(() => {
          if (longPressState?.pointerId === event.pointerId) {
            openMenu(item, event.clientX, event.clientY);
            longPressState = null;
          }
        }, LONG_PRESS_MS),
      };
    });

    element.addEventListener("pointermove", (event) => {
      if (!longPressState || longPressState.pointerId !== event.pointerId) return;
      const distance = Math.hypot(
        event.clientX - longPressState.startX,
        event.clientY - longPressState.startY,
      );
      if (distance > LONG_PRESS_MOVE_TOLERANCE) cancelLongPress();
    });
    element.addEventListener("pointerup", cancelLongPress);
    element.addEventListener("pointercancel", cancelLongPress);
  }

  window.NSGlamourItemReferenceMenu = { attach, hide: hideMenu };
})();
