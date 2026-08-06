(function () {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const COMPACT_MODE = "compact";
  const SPACIOUS_MODE = "spacious";

  function normalizeMode(value) {
    return value === SPACIOUS_MODE ? SPACIOUS_MODE : COMPACT_MODE;
  }

  function sortEntries(entries, slotOrder) {
    const ranks = new Map(slotOrder.map((slot, index) => [slot, index]));
    return [...entries].sort((left, right) => (
      (ranks.get(left.slot) ?? slotOrder.length)
      - (ranks.get(right.slot) ?? slotOrder.length)
    ));
  }

  function buildEntries(entries, slotNames, mode, slotOrder) {
    const sorted = sortEntries(Array.isArray(entries) ? entries : [], slotOrder);
    if (normalizeMode(mode) === COMPACT_MODE) {
      return sorted;
    }

    const entriesBySlot = new Map(sorted.map((entry) => [entry.slot, entry]));
    return slotOrder.map((slot) => entriesBySlot.get(slot) || {
      slot,
      slot_names: slotNames?.[slot] || {},
      item: null,
    });
  }

  function splitEntries(entries) {
    if (entries.length <= 5) {
      return [entries];
    }
    const splitAt = Math.ceil(entries.length / 2);
    return [entries.slice(0, splitAt), entries.slice(splitAt)];
  }

  root.NSGlamourSnapshotLayout = {
    COMPACT_MODE,
    SPACIOUS_MODE,
    buildEntries,
    normalizeMode,
    splitEntries,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.NSGlamourSnapshotLayout;
  }
})();
