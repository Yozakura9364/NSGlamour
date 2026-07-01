import importlib.util
import sys
from pathlib import Path

app_path = Path(__file__).resolve().parents[1] / "scripts" / "app.py"
sys.path.insert(0, str(app_path.parent))
spec = importlib.util.spec_from_file_location("nsglamour_app", app_path)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


def build_mapping():
    return {
        "locales": ["zh", "en"],
        "slot_names": app.DEFAULT_SLOT_NAMES,
        "stains_by_locale": {
            "zh": {"0": "无染色", "101": "无瑕白", "102": "煤玉黑"},
            "en": {"0": "No Color", "101": "Pure White", "102": "Jet Black"},
        },
        "stain_colors": {
            "101": {"hex": "#F9F8F4", "rgb": 16382196, "group": 10, "sub_order": 1},
            "102": {"hex": "#1E1E1E", "rgb": 1973790, "group": 10, "sub_order": 2},
        },
        "stain_groups": {"10": "特殊色"},
        "items": [
            {
                "key": 40000,
                "names": {"zh": "测试上衣", "en": "Test Top"},
                "name": "测试上衣",
                "slot_label": app.RESOLVER_SLOT_LABELS["Body"],
                "equip_slot_category": 4,
                "dye_count": 2,
                "model_main": {"primary": 1000, "secondary": 1, "tertiary": 0, "quaternary": 0, "raw": "1000, 1, 0, 0"},
            },
        ],
    }


def test_duplicate_ec_dyes_are_preserved():
    parsed = app.parse_ec_dyes(
        '<div class="tag">Pure White Dye</div>'
        '<div class="tag">Pure White Dye</div>'
    )
    assert parsed == ["Pure White", "Pure White"]

    resolved = app.build_ec_resolved_entry(
        {"slot": "Body", "item_name": "Test Top", "dyes": parsed},
        build_mapping(),
    )
    assert resolved["dye_id"] == 101
    assert resolved["dye_id_2"] == 101
    assert resolved["source"]["dyes"] == ["Pure White", "Pure White"]
    assert resolved["candidates"][0]["dye_display"] == "无瑕白 | 无瑕白"


def test_ec_no_color_first_slot_does_not_shift_second_slot():
    parsed = app.parse_ec_dyes(
        '<div class="tag">No Color</div>'
        '<div class="tag">Jet Black Dye</div>'
    )
    assert parsed == ["No Color", "Jet Black"]

    resolved = app.build_ec_resolved_entry(
        {"slot": "Body", "item_name": "Test Top", "dyes": parsed},
        build_mapping(),
    )
    assert resolved["dye_id"] == 0
    assert resolved["dye_id_2"] == 102
    assert resolved["source"]["dyes"] == ["No Color", "Jet Black"]
    assert resolved["candidates"][0]["dye_display"] == "无染色 | 煤玉黑"


test_duplicate_ec_dyes_are_preserved()
test_ec_no_color_first_slot_does_not_shift_second_slot()

print("ec dye slots ok")
