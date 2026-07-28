import importlib.util
import sys
from email.message import Message
from io import BytesIO
from pathlib import Path
from unittest import mock

app_path = Path(__file__).resolve().parents[1] / "scripts" / "app.py"
sys.path.insert(0, str(app_path.parent))
spec = importlib.util.spec_from_file_location("nsglamour_app", app_path)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)

EC_URL = "https://ffxiv.eorzeacollection.com/glamour/23881/titanias-embrace"
EC_BLOCKED_HTML = """
<html><title>Sorry, you have been blocked</title>
<body>You are unable to access eorzeacollection.com. Performance & security by Cloudflare.</body></html>
"""


class FakeEcResponse:
    def __init__(self, body):
        self.body = body
        self.headers = Message()
        self.headers["Content-Type"] = "text/html; charset=utf-8"

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def geturl(self):
        return EC_URL

    def read(self, _limit=-1):
        return self.body


class FakeEcOpener:
    def __init__(self, result):
        self.result = result

    def open(self, _request, timeout=0):
        if isinstance(self.result, BaseException):
            raise self.result
        return self.result


def assert_ec_fetch_blocked(result):
    with mock.patch.object(app.urllib.request, "build_opener", return_value=FakeEcOpener(result)):
        try:
            app.fetch_ec_html(EC_URL)
        except ValueError as exc:
            assert "拒绝此服务器访问" in str(exc)
        else:
            raise AssertionError("blocked EC response should fail")


def test_ec_cloudflare_block_page():
    assert app.is_ec_access_blocked_page(EC_BLOCKED_HTML)
    assert "拒绝此服务器访问" in str(app.ec_access_blocked_error())
    assert not app.is_ec_access_blocked_page("<html><body><div>Equipment</div></body></html>")

    body = EC_BLOCKED_HTML.encode("utf-8")
    assert_ec_fetch_blocked(FakeEcResponse(body))

    headers = Message()
    headers["Content-Type"] = "text/html; charset=utf-8"
    error = app.urllib.error.HTTPError(EC_URL, 403, "Forbidden", headers, BytesIO(body))
    assert_ec_fetch_blocked(error)


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
        <div class="c-gear-slot-item"><span class="c-gear-slot-item-name">Makai Markswoman's Ribbon</span><span class="c-gear-slot-item-info-color"><span>⬤ </span>Metallic Yellow</span></div>
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


def test_ec_legacy_accessory_slots():
    legacy_slots = [
        ("earrings", "Legacy Earrings", 41001),
        ("necklace", "Legacy Necklace", 41002),
        ("bracelets", "Legacy Bracelets", 41003),
        ("ring", "Legacy Ring One", 41004),
        ("ring", "Legacy Ring Two", 41005),
        ("facewear", "Legacy Facewear", 41006),
        ("fashion", "Legacy Fashion Accessory", 41007),
    ]
    blocks = "".join(
        f"""
        <div class="b-info-box-item-wrapper">
          <a class="c-gear-slot c-gear-slot-{slot_class} b-info-box-item"><img class="b-info-box-item-icon" src="https://icons.eorzeacollection.com/041000/{icon:06d}.png"></a>
          <div class="c-gear-slot-item"><span class="c-gear-slot-item-name">{item_name}</span></div>
        </div>
        """
        for slot_class, item_name, icon in legacy_slots
    )
    document = f"""
    <section class="b-info-box">
      <div class="b-info-box-category"><span class="b-info-box-category-title">Equipment:</span></div>
      {blocks}
    </section>
    """
    equipment = app.parse_ec_equipment(document)
    assert [(entry["slot"], entry["item_name"]) for entry in equipment] == [
        ("Ears", "Legacy Earrings"),
        ("Neck", "Legacy Necklace"),
        ("Wrists", "Legacy Bracelets"),
        ("LeftRing", "Legacy Ring One"),
        ("RightRing", "Legacy Ring Two"),
        ("Glasses", "Legacy Facewear"),
        ("FashionAccessory", "Legacy Fashion Accessory"),
    ]


def test_ec_legacy_author_and_gender():
    document = """
    <h2 class="b-title-sub">by <b>Xil Ventus</b> from «Siren»</h2>
    <img class="c-set-fitting-icon c-set-fitting-icon-unfit" src="/resources/icons/genders/gender-male.png">
    <img class="c-set-fitting-icon" src="/resources/icons/genders/gender-female.png">
    """
    assert app.extract_ec_author(document) == {
        "name": "Xil Ventus",
        "world": "Siren",
        "label": "Xil Ventus «Siren»",
    }
    assert app.extract_ec_character(document) == {"race": "", "gender": "Female"}


def test_link_import_can_be_disabled_without_removing_parsers():
    with mock.patch.object(app, "LINK_IMPORT_ENABLED", False):
        with app.app.test_client() as client:
            response = client.post(
                "/api/import-glamour-link",
                json={"url": EC_URL},
            )
            assert response.status_code == 503
            assert response.get_json() == {"error": "网页链接导入暂时关闭"}
            assert b"templateImportLinkButton" not in client.get("/template").data
            equipinfo_page = client.get("/equipinfo").data
            assert b"equipinfoLinkForm" not in equipinfo_page
            assert b"equipinfoCharaDropOverlay" in equipinfo_page


test_ec_cloudflare_block_page()
test_risingstones_detail_id_forms()
test_ec_legacy_equipment_layout()
test_ec_legacy_accessory_slots()
test_ec_legacy_author_and_gender()
test_link_import_can_be_disabled_without_removing_parsers()

print("link import guards ok")
