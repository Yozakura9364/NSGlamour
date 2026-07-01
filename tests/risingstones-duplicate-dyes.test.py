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
        "locales": ["zh"],
        "slot_names": app.DEFAULT_SLOT_NAMES,
        "stains_by_locale": {"zh": {"0": "无染色", "50": "日落橙", "101": "无瑕白"}},
        "stain_colors": {
            "50": {"hex": "#B65F34", "rgb": 11951924, "group": 5, "sub_order": 7},
            "101": {"hex": "#F9F8F4", "rgb": 16382196, "group": 10, "sub_order": 1},
        },
        "stain_groups": {"5": "橙色系", "10": "特殊色"},
        "items": [
            {
                "key": 47918,
                "names": {"zh": "霓虹街头鞋"},
                "name": "霓虹街头鞋",
                "slot_label": app.RESOLVER_SLOT_LABELS["Feet"],
                "equip_slot_category": 8,
                "dye_count": 2,
                "model_main": {"primary": 6209, "secondary": 1, "tertiary": 0, "quaternary": 0, "raw": "6209, 1, 0, 0"},
            },
            {
                "key": 40000,
                "names": {"zh": "测试上衣"},
                "name": "测试上衣",
                "slot_label": app.RESOLVER_SLOT_LABELS["Body"],
                "equip_slot_category": 4,
                "dye_count": 2,
                "model_main": {"primary": 1000, "secondary": 1, "tertiary": 0, "quaternary": 0, "raw": "1000, 1, 0, 0"},
            },
        ],
    }


def test_duplicate_dyes():
    equipment = {
        "slot": "FEET",
        "equipment_id": 47918,
        "dye_ids": [13114, 13114],
        "dyes": [
            {"id": 13114, "name": "无瑕白染剂", "color": "#f9f8f4"},
            {"id": 13114, "name": "无瑕白染剂", "color": "#f9f8f4"},
        ],
    }

    assert app.get_rs_dye_ids(equipment) == [13114, 13114]
    assert app.get_rs_dye_names(equipment) == ["无瑕白染剂", "无瑕白染剂"]
    assert app.get_rs_dye_colors(equipment) == ["#f9f8f4", "#f9f8f4"]

    entry = {
        "slot": "Feet",
        "item_id": 47918,
        "item_name": "霓虹街头鞋",
        "dye_ids": [13114, 13114],
        "dye_names": ["无瑕白染剂", "无瑕白染剂"],
        "dye_colors": ["#f9f8f4", "#f9f8f4"],
    }
    resolved = app.build_rs_resolved_entry(entry, build_mapping())
    assert resolved["dye_id"] == 101
    assert resolved["dye_id_2"] == 101
    assert resolved["source"]["dye_ids"] == [101, 101]
    assert resolved["candidates"][0]["dye_display"] == "无瑕白 | 无瑕白"


def test_first_slot_no_dye_second_slot_colored():
    equipment = {
        "slot": "BODY",
        "equipment_id": 40000,
        "dye_ids": [0, 13113],
        "dyes": [
            {"id": 0, "name": "无染色", "color": ""},
            {"id": 13113, "name": "日落橙染剂", "color": "#b65f34"},
        ],
    }

    assert app.get_rs_dye_ids(equipment) == [0, 13113]
    assert app.get_rs_dye_names(equipment) == ["无染色", "日落橙染剂"]
    assert app.get_rs_dye_colors(equipment) == ["", "#b65f34"]

    entry = {
        "slot": "Body",
        "item_id": 40000,
        "item_name": "测试上衣",
        "dye_ids": app.get_rs_dye_ids(equipment),
        "dye_names": app.get_rs_dye_names(equipment),
        "dye_colors": app.get_rs_dye_colors(equipment),
    }
    resolved = app.build_rs_resolved_entry(entry, build_mapping())
    assert resolved["dye_id"] == 0
    assert resolved["dye_id_2"] == 50
    assert resolved["source"]["dye_ids"] == [0, 50]
    assert resolved["candidates"][0]["dye_display"] == "无染色 | 日落橙"


def test_single_colored_object_does_not_shift_into_empty_first_slot():
    equipment = {
        "slot": "BODY",
        "equipment_id": 40000,
        "dye_ids": [0, 13113],
        "dyes": [{"id": 13113, "name": "日落橙染剂", "color": "#b65f34"}],
    }

    assert app.get_rs_dye_ids(equipment) == [0, 13113]
    assert app.get_rs_dye_names(equipment) == ["", "日落橙染剂"]
    assert app.get_rs_dye_colors(equipment) == ["", "#b65f34"]


test_duplicate_dyes()
test_first_slot_no_dye_second_slot_colored()
test_single_colored_object_does_not_shift_into_empty_first_slot()

print("risingstones dye slots ok")
