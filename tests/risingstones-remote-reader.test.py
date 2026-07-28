import importlib.util
import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import mock

app_path = Path(__file__).resolve().parents[1] / "scripts" / "app.py"
sys.path.insert(0, str(app_path.parent))
spec = importlib.util.spec_from_file_location("nsglamour_app", app_path)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


class FakeResponse:
    status = 200

    def __init__(self, payload):
        self.body = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def read(self, limit=-1):
        return self.body if limit < 0 else self.body[:limit]

    def getcode(self):
        return self.status


def test_remote_reader_request_and_response():
    with TemporaryDirectory() as directory:
        token_path = Path(directory) / "token"
        token_path.write_text("reader-secret\n", encoding="utf-8")
        payload = {
            "ok": True,
            "ids": ["274729"],
            "details": [{"id": 274729}],
            "failures": [],
        }

        def fake_urlopen(request, timeout=0):
            assert request.full_url == "http://100.64.65.72:18770/v1/glamour-detail"
            assert request.headers["Authorization"] == "Bearer reader-secret"
            assert json.loads(request.data.decode("utf-8")) == {"ids": ["274729"]}
            assert timeout == 45
            return FakeResponse(payload)

        with mock.patch.object(app, "RS_REMOTE_READER_URL", "http://100.64.65.72:18770"):
            with mock.patch.object(app, "RS_REMOTE_READER_TOKEN_FILE", token_path):
                with mock.patch.object(app.urllib.request, "urlopen", side_effect=fake_urlopen):
                    result = app.read_risingstones_details_via_remote_reader(["274729"])
        assert result["mode"] == "remote-reader"
        assert result["details"] == [{"id": 274729}]


def test_remote_reader_rejects_mismatched_ids():
    with TemporaryDirectory() as directory:
        token_path = Path(directory) / "token"
        token_path.write_text("reader-secret", encoding="utf-8")
        payload = {"ok": True, "ids": ["999999"], "details": [], "failures": []}
        with mock.patch.object(app, "RS_REMOTE_READER_URL", "http://100.64.65.72:18770"):
            with mock.patch.object(app, "RS_REMOTE_READER_TOKEN_FILE", token_path):
                with mock.patch.object(app.urllib.request, "urlopen", return_value=FakeResponse(payload)):
                    try:
                        app.read_risingstones_details_via_remote_reader(["274729"])
                    except RuntimeError as exc:
                        assert "ID 不匹配" in str(exc)
                    else:
                        raise AssertionError("mismatched IDs should fail")


def test_required_remote_reader_does_not_fallback():
    with mock.patch.object(app, "RS_REMOTE_READER_URL", "http://100.64.65.72:18770"):
        with mock.patch.object(app, "RS_REMOTE_READER_REQUIRED", True):
            with mock.patch.object(
                app,
                "read_risingstones_details_via_remote_reader",
                side_effect=RuntimeError("offline"),
            ):
                with mock.patch.object(app, "read_risingstones_details_via_browser") as browser_reader:
                    try:
                        app.read_risingstones_details(["274729"])
                    except RuntimeError as exc:
                        assert str(exc) == "offline"
                    else:
                        raise AssertionError("required remote reader failure should propagate")
                    browser_reader.assert_not_called()


test_remote_reader_request_and_response()
test_remote_reader_rejects_mismatched_ids()
test_required_remote_reader_does_not_fallback()

print("risingstones remote reader ok")
