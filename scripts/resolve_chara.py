import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List


DEFAULT_LOCALE = "zh"
DATAMINING_TAG_RE = re.compile(r"<(?:SoftHyphen|Indent)\s*/>", re.IGNORECASE)

SLOT_LABELS = {
    "MainHand": "武器",
    "OffHand": "武器",
    "HeadGear": "头部防具",
    "Body": "身体防具",
    "Hands": "手部防具",
    "Legs": "腿部防具",
    "Feet": "脚部防具",
    "Ears": "耳饰",
    "Neck": "项链",
    "Wrists": "手镯",
    "LeftRing": "戒指",
    "RightRing": "戒指",
    "Glasses": "面部配饰",
    "FashionAccessory": "时尚配饰",
}

DEFAULT_SLOT_NAMES = {
    "MainHand": {"zh": "主手"},
    "OffHand": {"zh": "副手"},
    "HeadGear": {"zh": "头部"},
    "Body": {"zh": "身体"},
    "Hands": {"zh": "手臂"},
    "Legs": {"zh": "腿部"},
    "Feet": {"zh": "脚部"},
    "Ears": {"zh": "耳部"},
    "Neck": {"zh": "颈部"},
    "Wrists": {"zh": "腕部"},
    "LeftRing": {"zh": "左指"},
    "RightRing": {"zh": "右指"},
    "Glasses": {"zh": "面部配饰"},
    "FashionAccessory": {"zh": "时尚配饰"},
}

DEFAULT_DYE_LABELS = {"zh": "染色："}
DEFAULT_UNDYEABLE_LABELS = {
    "zh": "不可染色",
    "tc": "不可染色",
    "en": "Undyeable",
    "ja": "染色不可",
    "ko": "염색 불가",
    "fr": "Teinture impossible",
    "de": "Nicht färbbar",
}


def build_no_dye_labels(mapping: Dict[str, Any]) -> Dict[str, str]:
    labels: Dict[str, str] = {}
    stains_by_locale = mapping.get("stains_by_locale") or {DEFAULT_LOCALE: mapping.get("stains", {})}
    fallback_stains = stains_by_locale.get(DEFAULT_LOCALE, {})

    for locale in get_locales(mapping):
        stains = stains_by_locale.get(locale) or fallback_stains
        labels[locale] = resolve_stain_name(0, stains, fallback_stains, locale)

    return labels


def load_json(path: str) -> Dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def clean_datamining_text(value: str) -> str:
    return DATAMINING_TAG_RE.sub("", str(value or ""))


def get_locales(mapping: Dict[str, Any]) -> List[str]:
    metadata = mapping.get("metadata", {})
    locales = metadata.get("locales")
    if isinstance(locales, list) and locales:
        return [str(locale) for locale in locales]
    return [DEFAULT_LOCALE]


def resolve_stain_name(stain_id: int, stains: Dict[str, str], fallback_stains: Dict[str, str], locale: str) -> str:
    fallback = "未知染剂" if locale == DEFAULT_LOCALE else "Unknown Dye"
    return stains.get(str(stain_id)) or fallback_stains.get(str(stain_id)) or f"{fallback}({stain_id})"


def build_dye_display_by_locale(
    dye_count: int,
    dye_id: int,
    dye_id_2: int,
    stains_by_locale: Dict[str, Dict[str, str]],
    locales: List[str],
) -> Dict[str, str]:
    displays: Dict[str, str] = {}

    for locale in locales:
        stains = stains_by_locale.get(locale) or stains_by_locale.get(DEFAULT_LOCALE, {})
        fallback_stains = stains_by_locale.get(DEFAULT_LOCALE, {})
        no_dye_label = resolve_stain_name(0, stains, fallback_stains, locale)
        if dye_count <= 0:
            displays[locale] = DEFAULT_UNDYEABLE_LABELS.get(locale, DEFAULT_UNDYEABLE_LABELS["en"])
        elif dye_count == 1:
            displays[locale] = resolve_stain_name(dye_id, stains, fallback_stains, locale) if dye_id > 0 else no_dye_label
        else:
            first = resolve_stain_name(dye_id, stains, fallback_stains, locale) if dye_id > 0 else no_dye_label
            second = resolve_stain_name(dye_id_2, stains, fallback_stains, locale) if dye_id_2 > 0 else no_dye_label
            displays[locale] = f"{first} | {second}"

    return displays


def build_dye_entry(
    stain_id: int,
    stains_by_locale: Dict[str, Dict[str, str]],
    stain_colors: Dict[str, Dict[str, Any]],
    stain_groups: Dict[str, str],
    locales: List[str],
) -> Dict[str, Any]:
    names: Dict[str, str] = {}
    fallback_stains = stains_by_locale.get(DEFAULT_LOCALE, {})

    for locale in locales:
        stains = stains_by_locale.get(locale) or fallback_stains
        names[locale] = resolve_stain_name(stain_id, stains, fallback_stains, locale) if stain_id > 0 else resolve_stain_name(0, stains, fallback_stains, locale)

    color = stain_colors.get(str(stain_id), {})
    group = int(color.get("group", 0) or 0)
    return {
        "id": stain_id,
        "names": names,
        "name": names.get(DEFAULT_LOCALE, ""),
        "hex": color.get("hex", "#000000") if stain_id > 0 else "#000000",
        "rgb": color.get("rgb", 0),
        "group": group,
        "group_name": stain_groups.get(str(group), ""),
        "sub_order": int(color.get("sub_order", 0) or 0),
    }


def build_dye_entries(
    dye_count: int,
    dye_id: int,
    dye_id_2: int,
    mapping: Dict[str, Any],
    locales: List[str],
) -> List[Dict[str, Any]]:
    if dye_count <= 0:
        return []

    stains_by_locale = mapping.get("stains_by_locale") or {DEFAULT_LOCALE: mapping.get("stains", {})}
    stain_colors = mapping.get("stain_colors") or {}
    stain_groups = mapping.get("stain_groups") or {}
    entries = [build_dye_entry(dye_id, stains_by_locale, stain_colors, stain_groups, locales)]
    if dye_count > 1:
        entries.append(build_dye_entry(dye_id_2, stains_by_locale, stain_colors, stain_groups, locales))
    return entries


def decorate_candidates(
    candidates: List[Dict[str, Any]],
    dye_id: int,
    dye_id_2: int,
    mapping: Dict[str, Any],
) -> List[Dict[str, Any]]:
    decorated = []
    locales = get_locales(mapping)
    stains_by_locale = mapping.get("stains_by_locale") or {DEFAULT_LOCALE: mapping.get("stains", {})}

    for candidate in candidates:
        dye_count = int(candidate.get("dye_count", 0))
        dye_display_by_locale = build_dye_display_by_locale(
            dye_count,
            dye_id,
            dye_id_2,
        stains_by_locale,
            locales,
        )
        dye_entries = build_dye_entries(dye_count, dye_id, dye_id_2, mapping, locales)
        names = {
            str(locale): clean_datamining_text(name)
            for locale, name in (candidate.get("names") or {DEFAULT_LOCALE: candidate.get("name", "")}).items()
        }
        decorated.append(
            {
                **candidate,
                "names": names,
                "name": names.get(DEFAULT_LOCALE) or candidate.get("name", ""),
                "dye_display": dye_display_by_locale.get(DEFAULT_LOCALE, ""),
                "dye_display_by_locale": dye_display_by_locale,
                "dye_entries": dye_entries,
            }
        )
    return decorated


def get_slot_names(slot_name: str, mapping: Dict[str, Any]) -> Dict[str, str]:
    slot_names = mapping.get("slot_names") or {}
    names = slot_names.get(slot_name) or DEFAULT_SLOT_NAMES.get(slot_name, {})
    if not names:
        return {DEFAULT_LOCALE: slot_name}
    return names


def apply_forced_rules(slot_name: str, model: Dict[str, int], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if slot_name == "Wrists" and model.get("base") == 53 and model.get("variant") == 1:
        forced = [candidate for candidate in candidates if int(candidate.get("key", 0)) == 9294]
        if forced:
            return forced
    return candidates


def resolve_glasses_entry(entry: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    glasses_id = int(entry.get("GlassesId", 0))
    raw_candidate = mapping.get("glasses", {}).get(str(glasses_id))
    candidates = [dict(raw_candidate)] if raw_candidate else []
    slot_names = get_slot_names("Glasses", mapping)

    for candidate in candidates:
        names = candidate.get("names") or {DEFAULT_LOCALE: candidate.get("name", "")}
        candidate["names"] = names
        candidate["name"] = names.get(DEFAULT_LOCALE) or candidate.get("name", "")
        candidate["dye_display"] = ""
        candidate["dye_display_by_locale"] = {}
        candidate["dye_entries"] = []
        candidate["dye_count"] = 0

    return {
        "slot": "Glasses",
        "slot_label": SLOT_LABELS["Glasses"],
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, "Glasses"),
        "lookup_key": f"Glasses|{glasses_id}",
        "model": {"id": glasses_id},
        "dye_id": 0,
        "dye_id_2": 0,
        "candidate_count": len(candidates),
        "candidates": candidates,
    }


def read_ornament_id(entry: Any) -> int:
    if isinstance(entry, dict):
        for key in ("OrnamentId", "FashionAccessoryId", "Id", "id"):
            if key in entry:
                return int(entry.get(key) or 0)
        return 0
    return int(entry or 0)


def resolve_fashion_accessory_entry(entry: Any, mapping: Dict[str, Any]) -> Dict[str, Any]:
    ornament_id = read_ornament_id(entry)
    raw_candidate = mapping.get("ornaments", {}).get(str(ornament_id))
    candidates = [dict(raw_candidate)] if raw_candidate else []
    slot_names = get_slot_names("FashionAccessory", mapping)

    for candidate in candidates:
        names = candidate.get("names") or {DEFAULT_LOCALE: candidate.get("name", "")}
        candidate["names"] = names
        candidate["name"] = names.get(DEFAULT_LOCALE) or candidate.get("name", "")
        candidate["dye_display"] = ""
        candidate["dye_display_by_locale"] = {}
        candidate["dye_entries"] = []
        candidate["dye_count"] = 0

    return {
        "slot": "FashionAccessory",
        "slot_label": SLOT_LABELS["FashionAccessory"],
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, "FashionAccessory"),
        "lookup_key": f"FashionAccessory|{ornament_id}",
        "model": {"id": ornament_id},
        "dye_id": 0,
        "dye_id_2": 0,
        "candidate_count": len(candidates),
        "candidates": candidates,
    }


def resolve_entry(slot_name: str, entry: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    if slot_name == "Glasses":
        return resolve_glasses_entry(entry, mapping)
    if slot_name == "FashionAccessory":
        return resolve_fashion_accessory_entry(entry, mapping)

    slot_label = SLOT_LABELS[slot_name]
    indexes = mapping.get("indexes", {})
    dye_id = int(entry.get("DyeId", 0))
    dye_id_2 = int(entry.get("DyeId2", 0))

    if slot_name in {"MainHand", "OffHand"}:
        model_set = int(entry.get("ModelSet", 0))
        model_base = int(entry.get("ModelBase", 0))
        model_variant = int(entry.get("ModelVariant", 0))
        key = f"{slot_label}|{model_set}|{model_base}|{model_variant}"
        raw_candidates = indexes.get("weapon", {}).get(key, [])
        model = {
            "set": model_set,
            "base": model_base,
            "variant": model_variant,
        }
    else:
        model_base = int(entry.get("ModelBase", 0))
        model_variant = int(entry.get("ModelVariant", 0))
        key = f"{slot_label}|{model_base}|{model_variant}"
        raw_candidates = indexes.get("armor_accessory", {}).get(key, [])
        model = {
            "base": model_base,
            "variant": model_variant,
        }

    candidates = decorate_candidates(raw_candidates, dye_id, dye_id_2, mapping)
    candidates = apply_forced_rules(slot_name, model, candidates)
    slot_names = get_slot_names(slot_name, mapping)

    return {
        "slot": slot_name,
        "slot_label": slot_label,
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, slot_name),
        "lookup_key": key,
        "model": model,
        "dye_id": dye_id,
        "dye_id_2": dye_id_2,
        "candidate_count": len(candidates),
        "candidates": candidates,
    }


def resolve_chara(chara: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    resolved_equipment = []
    for slot_name in SLOT_LABELS:
        entry = chara.get(slot_name)
        if isinstance(entry, dict) or (slot_name == "FashionAccessory" and entry is not None):
            resolved_equipment.append(resolve_entry(slot_name, entry, mapping))
    for fallback_key in ("Ornament", "OrnamentId"):
        if any(entry.get("slot") == "FashionAccessory" for entry in resolved_equipment):
            break
        if fallback_key in chara:
            resolved_equipment.append(resolve_fashion_accessory_entry(chara.get(fallback_key), mapping))
            break

    metadata = mapping.get("metadata", {})
    return {
        "file_type": chara.get("TypeName"),
        "race": chara.get("Race"),
        "gender": chara.get("Gender"),
        "locales": metadata.get("locales", [DEFAULT_LOCALE]),
        "default_locale": metadata.get("default_locale", DEFAULT_LOCALE),
        "locale_labels": metadata.get("locale_labels", {DEFAULT_LOCALE: "chs"}),
        "slot_names": mapping.get("slot_names", DEFAULT_SLOT_NAMES),
        "dye_labels": mapping.get("dye_labels", DEFAULT_DYE_LABELS),
        "no_dye_labels": build_no_dye_labels(mapping),
        "resolved_equipment": resolved_equipment,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve .chara equipment against the mapping JSON")
    parser.add_argument("--chara", required=True, help="Path to the .chara file")
    parser.add_argument(
        "--mapping",
        default=str(Path("data") / "item_model_mapping.json"),
        help="Path to item_model_mapping.json",
    )
    parser.add_argument("--output", default="", help="Optional output JSON path")
    args = parser.parse_args()

    chara = load_json(args.chara)
    mapping = load_json(args.mapping)
    resolved = resolve_chara(chara, mapping)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(resolved, ensure_ascii=False, indent=2), encoding="utf-8")

    json.dump(resolved, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
