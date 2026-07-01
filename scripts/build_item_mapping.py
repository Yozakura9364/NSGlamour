import argparse
import copy
import csv
import io
import json
import re
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


PRIMARY_LOCALE = "zh"
DEFAULT_LOCALES = ["zh", "en", "ja", "ko", "tc", "fr", "de"]
SOFT_HYPHEN_TAG_RE = re.compile(r"<(?:SoftHyphen|Indent)\s*/>", re.IGNORECASE)

LANGUAGE_SOURCES = {
    "zh": {
        "label": "chs",
        "item": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Item.csv",
        "stain": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Stain.csv",
        "addon": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Addon.csv",
        "glasses": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Glasses.csv",
        "ornament": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Ornament.csv",
    },
    "en": {
        "label": "en",
        "item": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/Item.csv",
        "stain": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/Stain.csv",
        "addon": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/Addon.csv",
        "glasses": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/Glasses.csv",
        "ornament": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/Ornament.csv",
    },
    "ja": {
        "label": "ja",
        "item": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/Item.csv",
        "stain": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/Stain.csv",
        "addon": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/Addon.csv",
        "glasses": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/Glasses.csv",
        "ornament": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/Ornament.csv",
    },
    "ko": {
        "label": "ko",
        "item": "https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Item.csv",
        "stain": "https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Stain.csv",
        "addon": "https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Addon.csv",
        "glasses": "https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Glasses.csv",
        "ornament": "https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Ornament.csv",
    },
    "tc": {
        "label": "tc",
        "item": "https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Item.csv",
        "stain": "https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Stain.csv",
        "addon": "https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Addon.csv",
        "glasses": "https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Glasses.csv",
        "ornament": "https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Ornament.csv",
    },
    "fr": {
        "label": "fr",
        "item": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/fr/Item.csv",
        "stain": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/fr/Stain.csv",
        "addon": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/fr/Addon.csv",
        "glasses": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/fr/Glasses.csv",
        "ornament": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/fr/Ornament.csv",
    },
    "de": {
        "label": "de",
        "item": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/de/Item.csv",
        "stain": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/de/Stain.csv",
        "addon": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/de/Addon.csv",
        "glasses": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/de/Glasses.csv",
        "ornament": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/de/Ornament.csv",
    },
}

SLOT_LABELS = {
    1: "武器",
    2: "武器",
    3: "头部防具",
    4: "身体防具",
    5: "手部防具",
    7: "腿部防具",
    8: "脚部防具",
    9: "耳饰",
    10: "项链",
    11: "手镯",
    12: "戒指",
    13: "武器",
    15: "身体防具",
    16: "身体防具",
    18: "腿部防具",
    19: "身体防具",
    20: "身体防具",
    22: "身体防具",
    23: "身体防具",
}

SLOT_ADDON_KEYS = {
    "MainHand": 738,
    "OffHand": 739,
    "HeadGear": 740,
    "Body": 741,
    "Hands": 742,
    "Legs": 744,
    "Feet": 745,
    "Ears": 746,
    "Neck": 747,
    "Wrists": 748,
    "LeftRing": 750,
    "RightRing": 749,
    "Glasses": 16050,
    "FashionAccessory": 13675,
}

DYE_LABEL_ADDON_KEY = 12795
STAIN_GROUP_LABELS_BY_ORDER = [
    "灰色系",
    "红色系",
    "橙色系",
    "黄色系",
    "绿色系",
    "蓝色系",
    "紫色系",
    "特殊色",
]


def read_text(source: str) -> str:
    if source.startswith(("http://", "https://")):
        request = urllib.request.Request(
            source,
            headers={
                "User-Agent": "NSGlamour mapping builder",
            },
        )
        last_error = None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    return response.read().decode("utf-8-sig")
            except Exception as error:
                last_error = error
                if attempt < 2:
                    time.sleep(1 + attempt)
        raise last_error
    return Path(source).read_text(encoding="utf-8-sig")


def parse_int(value: str) -> int:
    value = (value or "").strip()
    if not value:
        return 0
    try:
        return int(value)
    except ValueError:
        return 0


def parse_model(raw_value: str) -> Optional[Tuple[int, int, int, int]]:
    if not raw_value:
        return None
    parts = [part.strip() for part in raw_value.split(",")]
    if len(parts) < 4:
        return None
    try:
        return tuple(int(part) for part in parts[:4])
    except ValueError:
        return None


def clean_text(value: str) -> str:
    text = str(value or "")
    text = SOFT_HYPHEN_TAG_RE.sub("", text)
    return text.strip()


def normalize_row(row: List[str], width: int) -> List[str]:
    if len(row) < width:
        return row + [""] * (width - len(row))
    if len(row) > width:
        return row[:width]
    return row


def load_sheet_rows(source: str) -> Iterable[Dict[str, str]]:
    text = read_text(source)
    rows = list(csv.reader(io.StringIO(text)))
    if len(rows) < 4:
        raise ValueError(f"CSV content is too short: {source}")

    headers = [value.lstrip("\ufeff").strip() for value in rows[1]]
    for row in rows[3:]:
        if not row:
            continue
        values = normalize_row(row, len(headers))
        yield dict(zip(headers, values))


def load_stain_map(source: str) -> Dict[str, str]:
    text = read_text(source)
    rows = list(csv.reader(io.StringIO(text)))
    if len(rows) < 4:
        raise ValueError(f"CSV content is too short: {source}")

    type_row = rows[2]
    string_columns = [index for index, value in enumerate(type_row) if value.strip() == "str"]
    fallback_columns = [7, 6, 5, 4]
    name_columns = list(reversed(string_columns)) or fallback_columns

    stains: Dict[str, str] = {}
    for row in rows[3:]:
        if not row:
            continue

        values = normalize_row(row, max(len(type_row), max(fallback_columns) + 1))
        stain_id = parse_int(values[0])
        name = ""
        for column in name_columns:
            if column < len(values) and values[column].strip():
                name = values[column].strip()
                break

        if name:
            stains[str(stain_id)] = name

    return stains


def load_stain_color_map(source: str) -> Dict[str, Dict[str, object]]:
    colors: Dict[str, Dict[str, object]] = {}
    for row in load_sheet_rows(source):
        stain_id = parse_int(row.get("#", "0"))
        color_value = parse_int(row.get("Color", "0"))
        shade = parse_int(row.get("Shade", "0"))
        sub_order = parse_int(row.get("SubOrder", "0"))
        color_hex = f"#{color_value & 0xFFFFFF:06X}"
        colors[str(stain_id)] = {
            "rgb": color_value,
            "hex": color_hex,
            "group": shade,
            "sub_order": sub_order,
        }
    return colors


def build_stain_group_labels(stain_colors: Dict[str, Dict[str, object]]) -> Dict[str, str]:
    group_ids = sorted(
        {
            int(data.get("group", 0) or 0)
            for data in stain_colors.values()
            if int(data.get("group", 0) or 0) > 0
        }
    )
    return {
        str(group_id): STAIN_GROUP_LABELS_BY_ORDER[index]
        if index < len(STAIN_GROUP_LABELS_BY_ORDER)
        else f"分组 {group_id}"
        for index, group_id in enumerate(group_ids)
    }


def load_item_name_map(source: str) -> Dict[str, str]:
    names: Dict[str, str] = {}
    for row in load_sheet_rows(source):
        item_id = str(parse_int(row.get("#", "0")))
        name = clean_text(row.get("Name", ""))
        if item_id and name:
            names[item_id] = name
    return names


def load_glasses_map(source: str) -> Dict[str, Dict[str, object]]:
    glasses: Dict[str, Dict[str, object]] = {}
    for row in load_sheet_rows(source):
        glasses_id = parse_int(row.get("#", "0"))
        if glasses_id <= 0:
            continue

        name = clean_text(row.get("Name", ""))
        if not name:
            continue

        glasses[str(glasses_id)] = {
            "key": glasses_id,
            "name": name,
            "icon": parse_int(row.get("Icon", "0")),
        }
    return glasses


def load_ornament_map(source: str) -> Dict[str, Dict[str, object]]:
    ornaments: Dict[str, Dict[str, object]] = {}
    for row in load_sheet_rows(source):
        ornament_id = parse_int(row.get("#", "0"))
        model_chara = parse_int(row.get("Model", "0"))
        if ornament_id <= 0 or model_chara <= 0:
            continue

        name = clean_text(row.get("Singular", "") or row.get("Name", ""))
        if not name:
            continue

        ornaments[str(ornament_id)] = {
            "key": ornament_id,
            "name": name,
            "icon": parse_int(row.get("Icon", "0")),
            "model_chara": model_chara,
        }
    return ornaments


def load_addon_text_map(source: str, addon_keys: Iterable[int]) -> Dict[str, str]:
    wanted = {str(key) for key in addon_keys}
    names: Dict[str, str] = {}
    for row in load_sheet_rows(source):
        key = str(parse_int(row.get("#", "0")))
        if key not in wanted:
            continue
        text = clean_text(row.get("Text", ""))
        if text:
            names[key] = text
    return names


def collect_locale_maps(
    locales: List[str],
    language_sources: Dict[str, Dict[str, str]],
) -> Tuple[
    Dict[str, Dict[str, str]],
    Dict[str, Dict[str, str]],
    Dict[str, Dict[str, str]],
    Dict[str, Dict[str, object]],
    Dict[str, Dict[str, Dict[str, object]]],
    Dict[str, Dict[str, Dict[str, object]]],
]:
    item_names_by_locale: Dict[str, Dict[str, str]] = {}
    stains_by_locale: Dict[str, Dict[str, str]] = {}
    addon_by_locale: Dict[str, Dict[str, str]] = {}
    stain_colors: Dict[str, Dict[str, object]] = {}
    glasses_by_locale: Dict[str, Dict[str, Dict[str, object]]] = {}
    ornaments_by_locale: Dict[str, Dict[str, Dict[str, object]]] = {}

    for locale in locales:
        source = language_sources[locale]
        item_names_by_locale[locale] = load_item_name_map(source["item"])
        addon_keys = list(SLOT_ADDON_KEYS.values()) + [DYE_LABEL_ADDON_KEY]
        addon_by_locale[locale] = load_addon_text_map(source["addon"], addon_keys)
        glasses_by_locale[locale] = load_glasses_map(source["glasses"])
        ornaments_by_locale[locale] = load_ornament_map(source["ornament"])
        stains = load_stain_map(source["stain"])
        if locale == PRIMARY_LOCALE:
            stains.setdefault("0", "无染色")
        elif locale == "en":
            stains.setdefault("0", "No Color")
        elif locale == "ja":
            stains.setdefault("0", "染色なし")
        elif locale == "ko":
            stains.setdefault("0", "염색 없음")
        elif locale == "tc":
            stains.setdefault("0", "無染色")
        elif locale == "fr":
            stains.setdefault("0", "Aucune")
        elif locale == "de":
            stains.setdefault("0", "Keine Farbe")
        stains_by_locale[locale] = stains
        if locale == PRIMARY_LOCALE:
            stain_colors = load_stain_color_map(source["stain"])

    return item_names_by_locale, stains_by_locale, addon_by_locale, stain_colors, glasses_by_locale, ornaments_by_locale


def build_localized_names(item_id: str, item_names_by_locale: Dict[str, Dict[str, str]]) -> Dict[str, str]:
    primary_name = item_names_by_locale.get(PRIMARY_LOCALE, {}).get(item_id, "")
    names: Dict[str, str] = {}
    for locale, item_names in item_names_by_locale.items():
        name = item_names.get(item_id) or primary_name
        if name:
            names[locale] = name
    return names


def build_glasses_records(
    glasses_by_locale: Dict[str, Dict[str, Dict[str, object]]],
) -> Dict[str, Dict[str, object]]:
    primary_records = glasses_by_locale.get(PRIMARY_LOCALE, {})
    glasses_ids = sorted(
        {
            glasses_id
            for records in glasses_by_locale.values()
            for glasses_id in records
        },
        key=lambda value: parse_int(value),
    )
    glasses: Dict[str, Dict[str, object]] = {}

    for glasses_id in glasses_ids:
        primary_record = primary_records.get(glasses_id, {})
        primary_name = str(primary_record.get("name", "") or "")
        icon = parse_int(str(primary_record.get("icon", "0")))
        names: Dict[str, str] = {}

        for locale, records in glasses_by_locale.items():
            record = records.get(glasses_id, {})
            name = str(record.get("name", "") or primary_name)
            if name:
                names[locale] = name
            if not icon:
                icon = parse_int(str(record.get("icon", "0")))

        if not names:
            continue

        glasses[glasses_id] = {
            "key": parse_int(glasses_id),
            "key_label": "编号",
            "name": names.get(PRIMARY_LOCALE) or next(iter(names.values())),
            "names": names,
            "is_emperor": is_emperor_item(names),
            "icon": icon,
            "dye_count": 0,
        }

    return glasses


def build_ornament_records(
    ornaments_by_locale: Dict[str, Dict[str, Dict[str, object]]],
) -> Dict[str, Dict[str, object]]:
    primary_records = ornaments_by_locale.get(PRIMARY_LOCALE, {})
    ornament_ids = sorted(
        {
            ornament_id
            for records in ornaments_by_locale.values()
            for ornament_id in records
        },
        key=lambda value: parse_int(value),
    )
    ornaments: Dict[str, Dict[str, object]] = {}

    for ornament_id in ornament_ids:
        primary_record = primary_records.get(ornament_id, {})
        primary_name = str(primary_record.get("name", "") or "")
        icon = parse_int(str(primary_record.get("icon", "0")))
        model_chara = parse_int(str(primary_record.get("model_chara", "0")))
        names: Dict[str, str] = {}

        for locale, records in ornaments_by_locale.items():
            record = records.get(ornament_id, {})
            name = str(record.get("name", "") or primary_name)
            if name:
                names[locale] = name
            if not icon:
                icon = parse_int(str(record.get("icon", "0")))
            if not model_chara:
                model_chara = parse_int(str(record.get("model_chara", "0")))

        if not names:
            continue

        ornaments[ornament_id] = {
            "key": parse_int(ornament_id),
            "key_label": "编号",
            "name": names.get(PRIMARY_LOCALE) or next(iter(names.values())),
            "names": names,
            "is_emperor": False,
            "icon": icon,
            "model_chara": model_chara,
            "dye_count": 0,
        }

    return ornaments


def build_slot_names(addon_by_locale: Dict[str, Dict[str, str]]) -> Dict[str, Dict[str, str]]:
    slot_names: Dict[str, Dict[str, str]] = {}
    primary_addons = addon_by_locale.get(PRIMARY_LOCALE, {})
    for slot, addon_key in SLOT_ADDON_KEYS.items():
        key = str(addon_key)
        fallback = primary_addons.get(key, slot)
        slot_names[slot] = {
            locale: addon_map.get(key) or fallback
            for locale, addon_map in addon_by_locale.items()
        }
    return slot_names


def clean_addon_label(text: str) -> str:
    return (text or "").split("<", 1)[0]


def build_dye_labels(addon_by_locale: Dict[str, Dict[str, str]]) -> Dict[str, str]:
    key = str(DYE_LABEL_ADDON_KEY)
    primary_label = clean_addon_label(addon_by_locale.get(PRIMARY_LOCALE, {}).get(key, "")) or "染色："
    labels: Dict[str, str] = {}
    for locale, addon_map in addon_by_locale.items():
        labels[locale] = clean_addon_label(addon_map.get(key, "")) or primary_label
    return labels


def is_emperor_item(names: Dict[str, str]) -> bool:
    primary_name = names.get(PRIMARY_LOCALE, "")
    if "皇帝的" in primary_name:
        return True

    emperor_markers = [
        "Emperor's",
        "emperor's",
        "エンペラーズ",
        "皇帝的",
        "황제의",
        "임금님의",
    ]
    return any(marker in name for name in names.values() for marker in emperor_markers)


def build_item_record(
    row: Dict[str, str],
    slot_label: str,
    model: Tuple[int, int, int, int],
    item_names_by_locale: Dict[str, Dict[str, str]],
) -> Dict[str, object]:
    primary, secondary, tertiary, quaternary = model
    item_id = str(parse_int(row.get("#", "0")))
    names = build_localized_names(item_id, item_names_by_locale)
    primary_name = names.get(PRIMARY_LOCALE) or row.get("Name", "")

    return {
        "key": parse_int(item_id),
        "name": primary_name,
        "names": names,
        "is_emperor": is_emperor_item(names),
        "icon": parse_int(row.get("Icon", "0")),
        "rarity": parse_int(row.get("Rarity", "1")) or 1,
        "equip_slot_category": parse_int(row.get("EquipSlotCategory", "0")),
        "slot_label": slot_label,
        "dye_count": parse_int(row.get("DyeCount", "0")),
        "model_main": {
            "primary": primary,
            "secondary": secondary,
            "tertiary": tertiary,
            "quaternary": quaternary,
            "raw": f"{primary}, {secondary}, {tertiary}, {quaternary}",
        },
    }


def append_unique(target: List[Dict[str, object]], item: Dict[str, object]) -> None:
    item_key = item["key"]
    if any(existing["key"] == item_key for existing in target):
        return
    target.append(item)


def parse_locale_list(value: str) -> List[str]:
    locales = [part.strip() for part in value.split(",") if part.strip()]
    if PRIMARY_LOCALE not in locales:
        locales.insert(0, PRIMARY_LOCALE)
    return locales


def build_language_sources(item_csv: str, stain_csv: str, addon_csv: str) -> Dict[str, Dict[str, str]]:
    language_sources = copy.deepcopy(LANGUAGE_SOURCES)
    if item_csv:
        language_sources[PRIMARY_LOCALE]["item"] = item_csv
    if stain_csv:
        language_sources[PRIMARY_LOCALE]["stain"] = stain_csv
    if addon_csv:
        language_sources[PRIMARY_LOCALE]["addon"] = addon_csv
    return language_sources


def build_mapping(item_csv: str, stain_csv: str, addon_csv: str, locales: List[str]) -> Dict[str, object]:
    language_sources = build_language_sources(item_csv, stain_csv, addon_csv)
    unknown = [locale for locale in locales if locale not in language_sources]
    if unknown:
        raise ValueError(f"Unknown locale(s): {', '.join(unknown)}")

    item_names_by_locale, stains_by_locale, addon_by_locale, stain_colors, glasses_by_locale, ornaments_by_locale = collect_locale_maps(
        locales,
        language_sources,
    )
    slot_names = build_slot_names(addon_by_locale)
    dye_labels = build_dye_labels(addon_by_locale)
    stain_groups = build_stain_group_labels(stain_colors)
    glasses = build_glasses_records(glasses_by_locale)
    ornaments = build_ornament_records(ornaments_by_locale)

    armor_index = defaultdict(list)
    weapon_index = defaultdict(list)
    items: List[Dict[str, object]] = []
    primary_item_source = language_sources[PRIMARY_LOCALE]["item"]

    for row in load_sheet_rows(primary_item_source):
        slot_code = parse_int(row.get("EquipSlotCategory", "0"))
        slot_label = SLOT_LABELS.get(slot_code)
        if not slot_label:
            continue

        model = parse_model(row.get("Model{Main}", ""))
        if not model:
            continue

        primary, secondary, tertiary, quaternary = model
        if primary == 0 and secondary == 0 and tertiary == 0 and quaternary == 0:
            continue

        item = build_item_record(row, slot_label, model, item_names_by_locale)
        items.append(item)

        if slot_label == "武器":
            key = f"{slot_label}|{primary}|{secondary}|{tertiary}"
            append_unique(weapon_index[key], item)
        else:
            key = f"{slot_label}|{primary}|{secondary}"
            append_unique(armor_index[key], item)

    locale_labels = {
        locale: language_sources[locale].get("label", locale)
        for locale in locales
    }

    return {
        "metadata": {
            "default_locale": PRIMARY_LOCALE,
            "locales": locales,
            "locale_labels": locale_labels,
            "item_sources": {locale: language_sources[locale]["item"] for locale in locales},
            "stain_sources": {locale: language_sources[locale]["stain"] for locale in locales},
            "addon_sources": {locale: language_sources[locale]["addon"] for locale in locales},
            "glasses_sources": {locale: language_sources[locale]["glasses"] for locale in locales},
            "ornament_sources": {locale: language_sources[locale]["ornament"] for locale in locales},
        },
        "stains": stains_by_locale.get(PRIMARY_LOCALE, {}),
        "stains_by_locale": stains_by_locale,
        "stain_colors": stain_colors,
        "stain_groups": stain_groups,
        "slot_names": slot_names,
        "dye_labels": dye_labels,
        "glasses": glasses,
        "ornaments": ornaments,
        "indexes": {
            "armor_accessory": dict(sorted(armor_index.items())),
            "weapon": dict(sorted(weapon_index.items())),
        },
        "items": items,
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Build a multi-language glamour mapping from datamining CSV files")
    parser.add_argument("--item-csv", default="", help="Optional zh Item.csv override")
    parser.add_argument("--stain-csv", default="", help="Optional zh Stain.csv override")
    parser.add_argument("--addon-csv", default="", help="Optional zh Addon.csv override")
    parser.add_argument("--locales", default=",".join(DEFAULT_LOCALES), help="Comma-separated locale list")
    parser.add_argument(
        "--output",
        default=str(Path("data") / "item_model_mapping.json"),
        help="Output JSON path",
    )
    args = parser.parse_args()

    locales = parse_locale_list(args.locales)
    try:
        mapping = build_mapping(args.item_csv, args.stain_csv, args.addon_csv, locales)
    except Exception as error:
        print(f"Error building mapping: {error}", file=sys.stderr)
        return 1
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = {
        "output": str(output_path.resolve()),
        "locales": mapping["metadata"]["locales"],
        "item_count": len(mapping["items"]),
        "stain_count": {locale: len(stains) for locale, stains in mapping["stains_by_locale"].items()},
        "stain_color_count": len(mapping["stain_colors"]),
        "stain_groups": mapping["stain_groups"],
        "slot_count": len(mapping["slot_names"]),
        "dye_labels": mapping["dye_labels"],
        "glasses_count": len(mapping["glasses"]),
        "ornament_count": len(mapping["ornaments"]),
        "armor_accessory_keys": len(mapping["indexes"]["armor_accessory"]),
        "weapon_keys": len(mapping["indexes"]["weapon"]),
    }
    json.dump(summary, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
