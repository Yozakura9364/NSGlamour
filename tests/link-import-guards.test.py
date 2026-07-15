import importlib.util
import sys
from pathlib import Path

app_path = Path(__file__).resolve().parents[1] / "scripts" / "app.py"
sys.path.insert(0, str(app_path.parent))
spec = importlib.util.spec_from_file_location("nsglamour_app", app_path)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


def test_ec_cloudflare_block_page():
    blocked = """
    <html><title>Sorry, you have been blocked</title>
    <body>You are unable to access eorzeacollection.com. Performance & security by Cloudflare.</body></html>
    """
    assert app.is_ec_access_blocked_page(blocked)
    assert "拒绝此服务器访问" in str(app.ec_access_blocked_error())
    assert not app.is_ec_access_blocked_page("<html><body><div>Equipment</div></body></html>")


def test_risingstones_detail_id_forms():
    expected = ["274729"]
    assert app.extract_risingstones_glamour_ids(
        "https://ff14risingstones.web.sdo.com/pc/index.html#/glamour/detail/274729"
    ) == expected
    assert app.extract_risingstones_glamour_ids(
        "https://ff14risingstones.web.sdo.com/pc/index.html#/publish/glamour/detail/274729"
    ) == expected
    assert app.extract_risingstones_glamour_ids(
        "https://ff14risingstones.web.sdo.com/pc/index.html?id=274729"
    ) == expected
    assert app.extract_risingstones_glamour_ids("274729") == expected


def test_ec_legacy_equipment_layout():
    document = """
    <section class="b-info-box">
      <div class="b-info-box-category"><span class="b-info-box-category-title">Equipment:</span></div>
      <div class="b-info-box-item-wrapper">
        <a class="c-gear-slot c-gear-slot-head b-info-box-item"><img class="b-info-box-item-icon" src="https://icons.eorzeacollection.com/041000/041668.png"></a>
        <div class="c-gear-slot-item"><span class="c-gear-slot-item-name">Makai Markswoman's Ribbon</span><span class="c-gear-slot-item-info-color"><span>⬤ </span>Metallic Yellow</span></span></div>
      </div>
      <div class="b-info-box-item-wrapper">
        <a class="c-gear-slot c-gear-slot-body b-info-box-item"><img class="b-info-box-item-icon" src="https://icons.eorzeacollection.com/043000/043212.png"></a>
        <div class="c-gear-slot-item"><span class="c-gear-slot-item-name">Birdliege Coat</span><span class="c-gear-slot-item-info-color"><span>⬤ </span>Metallic Sky Blue</span><span class="c-gear-slot-item-info-color"><span>◯ Undyed</span></span></div>
      </div>
    </section>
    """
    equipment = app.parse_ec_equipment(document)
    assert [(entry["slot"], entry["item_name"], entry["icon"]) for entry in equipment] == [
        ("HeadGear", "Makai Markswoman's Ribbon", 41668),
        ("Body", "Birdliege Coat", 43212),
    ]
    assert equipment[0]["dyes"] == ["Metallic Yellow"]
    assert equipment[1]["dyes"] == ["Metallic Sky Blue", "No Color"]


test_ec_cloudflare_block_page()
test_risingstones_detail_id_forms()
test_ec_legacy_equipment_layout()

print("link import guards ok")
