(function () {
  "use strict";
  const root = typeof window !== "undefined" ? window : globalThis;

  function clampSlotCount(value, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(Math.floor(number), 2));
  }

  function resolveDyeOptions(format = {}) {
    const showWhenDyeCountZero = format.showWhenDyeCountZero
      ?? (format.includeUndyeableAsNoDye !== false);
    return {
      includeAccessories: format.includeAccessories === true,
      showWhenDyeCountZero,
      showEmptySlots: format.showEmptySlots !== false,
      maxSlots: clampSlotCount(format.maxSlots, 2),
      forceSlotCount: clampSlotCount(format.forceSlotCount, 0),
      separator: format.separator ?? " / ",
    };
  }

  function getSlotCount(row, options, actualCount, isExcludedSlot) {
    if (!row?.item || isExcludedSlot) return 0;
    const count = options.forceSlotCount > 0
      ? options.forceSlotCount
      : clampSlotCount(actualCount, 0);
    return Math.min(count, options.maxSlots || 2);
  }

  root.NSGlamourTemplateDyePolicy = {
    getSlotCount,
    resolveDyeOptions,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.NSGlamourTemplateDyePolicy;
  }
})();
