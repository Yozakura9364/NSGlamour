import base64
import hashlib
import html
import json
import mimetypes
import os
import re
import secrets
import shlex
import shutil
import socket
import struct
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from flask import Flask, abort, jsonify, redirect, render_template, request, send_file, url_for
from werkzeug.middleware.proxy_fix import ProxyFix

mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/woff2", ".woff2")

try:
    from .snapshots import EquipmentSnapshotStore, register_snapshot_routes
    from .resolve_chara import (
        DEFAULT_DYE_LABELS,
        DEFAULT_LOCALE,
        DEFAULT_SLOT_NAMES,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
        build_no_dye_labels,
        decorate_candidates,
        get_locales,
        get_slot_names,
        resolve_chara,
    )
except ImportError:
    from snapshots import EquipmentSnapshotStore, register_snapshot_routes
    from resolve_chara import (
        DEFAULT_DYE_LABELS,
        DEFAULT_LOCALE,
        DEFAULT_SLOT_NAMES,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
        build_no_dye_labels,
        decorate_candidates,
        get_locales,
        get_slot_names,
        resolve_chara,
    )


BASE_DIR = Path(__file__).resolve().parent.parent


def load_local_env_file(path: Path) -> None:
    if not path.is_file():
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ[key] = value


load_local_env_file(BASE_DIR / ".env.local")

DATA_DIR = BASE_DIR / "data"
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
FONT_DIR = BASE_DIR / "font"
MAPPING_PATH = DATA_DIR / "item_model_mapping.json"
UI_LOCALIZATION_PATH = DATA_DIR / "ui-localization.json"
ICON_BASE_URL = os.environ.get(
    "NSGLAMOUR_ICON_BASE_URL",
    "https://img.nightingalesilence.com/ui/icon",
).rstrip("/")
ICON_MAX_BYTES = 512 * 1024
ICON_CACHE_DIR = Path(os.environ.get("NSGLAMOUR_ICON_CACHE_DIR", str(BASE_DIR / ".runtime" / "icon-cache")))
SNAPSHOT_DB_PATH = Path(
    os.environ.get(
        "NSGLAMOUR_SNAPSHOT_DB_PATH",
        str(BASE_DIR / ".runtime" / "equipment-snapshots.sqlite3"),
    )
)
EC_ALLOWED_HOST = "ffxiv.eorzeacollection.com"
EC_MAX_HTML_BYTES = 1_200_000
EC_USER_AGENT = "Mozilla/5.0 (compatible; NSGlamour/1.0)"
RS_ALLOWED_ORIGIN = "https://ff14risingstones.web.sdo.com"
RS_API_BASE = "https://apiff14risingstones.web.sdo.com/api/home/"
RS_GLAMOUR_HOME_URL = f"{RS_ALLOWED_ORIGIN}/pc/index.html#/post"
RS_BROWSER_PROFILE_DIR = Path(os.environ.get("NSGLAMOUR_RS_BROWSER_PROFILE", str(BASE_DIR / ".runtime" / "risingstones-chrome-profile")))
RS_BROWSER_PORT = int(os.environ.get("NSGLAMOUR_RS_BROWSER_PORT", "18765"))
RS_BROWSER_PORT_FILE = BASE_DIR / ".runtime" / "risingstones-browser-port.json"
RS_BROWSER_HEADLESS = os.environ.get("NSGLAMOUR_RS_BROWSER_HEADLESS", "").lower() in {"1", "true", "yes", "on"}
RS_BROWSER_ALLOW_HEADED_FALLBACK = os.environ.get("NSGLAMOUR_RS_BROWSER_ALLOW_HEADED_FALLBACK", "").lower() in {"1", "true", "yes", "on"}
RS_BROWSER_NO_SANDBOX = os.environ.get("NSGLAMOUR_RS_BROWSER_NO_SANDBOX", "").lower() in {"1", "true", "yes", "on"}
RS_BROWSER_EXTRA_ARGS = shlex.split(os.environ.get("NSGLAMOUR_RS_BROWSER_ARGS", ""))
RS_REMOTE_READER_URL = os.environ.get("NSGLAMOUR_RS_READER_URL", "").strip().rstrip("/")
RS_REMOTE_READER_TOKEN_FILE = Path(
    os.environ.get("NSGLAMOUR_RS_READER_TOKEN_FILE", str(BASE_DIR / ".runtime" / "risingstones-reader-token"))
)
RS_REMOTE_READER_REQUIRED = os.environ.get("NSGLAMOUR_RS_READER_REQUIRED", "").lower() in {"1", "true", "yes", "on"}
RS_REMOTE_READER_MAX_BYTES = 2 * 1024 * 1024
LINK_IMPORT_ENABLED = os.environ.get("NSGLAMOUR_DISABLE_LINK_IMPORT", "").lower() not in {
    "1",
    "true",
    "yes",
    "on",
}
RS_READABLE_ERROR_PATTERNS = [
    (
        re.compile(r"请先登录", re.IGNORECASE),
        "石之家读取失效！请联系网站博主",
    ),
    (
        re.compile(r"登录页|login\.u\.sdo\.com|未登录|login", re.IGNORECASE),
        "石之家后台浏览器还没有完成登录。请先点“后台登录”，在弹出的专用浏览器里登录小号，登录后刷新石之家页面再重试。",
    ),
    (
        re.compile(r"没有找到已登录|没有找到.*石之家后台页面|No page", re.IGNORECASE),
        "没有找到已登录的石之家页面。请先点“后台登录”，确认专用浏览器打开的是石之家并且右上角已经登录。",
    ),
    (
        re.compile(r"DevTools|WebSocket|remote debugging|连接已关闭|握手|拒绝连接|无法连接", re.IGNORECASE),
        "连接后台浏览器失败。请确认服务器上的石之家专用浏览器仍在运行，DevTools 端口只监听 127.0.0.1，必要时重新执行登录脚本。",
    ),
    (
        re.compile(r"启动超时|没有找到 Chrome|Chromium|Edge|NSGLAMOUR_CHROME_PATH", re.IGNORECASE),
        "无法启动石之家后台浏览器。请检查服务器是否安装 Chrome/Chromium，或设置 NSGLAMOUR_CHROME_PATH 指向浏览器可执行文件。",
    ),
    (
        re.compile(r"接口错误|HTTP\s*(401|403)|unauthorized|forbidden|权限|风控", re.IGNORECASE),
        "石之家接口拒绝了这次读取。通常是登录态失效、账号需要验证，或刚登录后页面没有刷新；请重新打开后台登录页确认后再试。",
    ),
    (
        re.compile(r"failed to fetch|networkerror|err_", re.IGNORECASE),
        "石之家后台浏览器的请求被站点拦截了。程序会优先尝试改用非 headless 浏览器重试；如果仍失败，请确认服务器上的 Xvfb/桌面正常，并重新登录石之家小号。",
    ),
    (
        re.compile(r"详情 ID|detail", re.IGNORECASE),
        "没有识别到石之家幻化详情 ID。请粘贴形如 ff14risingstones.web.sdo.com/pc/index.html#/glamour/detail/数字 的详情链接，或直接输入详情 ID。",
    ),
]
MAX_CHARA_UPLOAD_MB = max(1, int(os.environ.get("NSGLAMOUR_MAX_CHARA_UPLOAD_MB", "5")))
ENABLE_CHARA_IMPORT = os.environ.get("NSGLAMOUR_ENABLE_CHARA_IMPORT", "1").lower() not in {"0", "false", "no"}
INCLUDE_DEBUG_ERRORS = os.environ.get("NSGLAMOUR_DEBUG_ERRORS", "").lower() in {"1", "true", "yes", "on"}
BASE_PATH = os.environ.get("NSGLAMOUR_BASE_PATH", "").strip().rstrip("/")
if BASE_PATH and not BASE_PATH.startswith("/"):
    BASE_PATH = f"/{BASE_PATH}"
STATIC_CACHE_SECONDS = 365 * 24 * 60 * 60
ICON_CACHE_SECONDS = 7 * 24 * 60 * 60
REFERENCE_DATA_CACHE_SECONDS = 60 * 60

SEARCH_SLOT_LABELS = {
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
}


def get_equip_slot_category(record: Dict[str, Any]) -> int:
    try:
        return int(record.get("equip_slot_category", 0) or 0)
    except (TypeError, ValueError):
        return 0


def item_matches_equipment_slot(item: Dict[str, Any], slot_name: str) -> bool:
    slot_label = RESOLVER_SLOT_LABELS.get(slot_name, "")
    if slot_label and item.get("slot_label") != slot_label:
        return False
    if slot_name == "OffHand":
        return get_equip_slot_category(item) == 2
    if slot_name == "MainHand":
        return get_equip_slot_category(item) != 2
    return True

EC_SLOT_TO_NS_SLOT = {
    "WEAPON": "MainHand",
    "MAIN HAND": "MainHand",
    "MAINHAND": "MainHand",
    "OFF HAND": "OffHand",
    "OFFHAND": "OffHand",
    "SHIELD": "OffHand",
    "HEAD": "HeadGear",
    "BODY": "Body",
    "CHEST": "Body",
    "HANDS": "Hands",
    "GLOVES": "Hands",
    "LEGS": "Legs",
    "FEET": "Feet",
    "EARRINGS": "Ears",
    "EARS": "Ears",
    "NECKLACE": "Neck",
    "NECK": "Neck",
    "BRACELETS": "Wrists",
    "BRACELET": "Wrists",
    "WRISTS": "Wrists",
    "LEFT RING": "LeftRing",
    "RING 1": "LeftRing",
    "RIGHT RING": "RightRing",
    "RING 2": "RightRing",
    "RING": "LeftRing",
    "FACE": "Glasses",
    "FACEWEAR": "Glasses",
    "FACE WEAR": "Glasses",
    "FACE ACCESSORY": "Glasses",
    "FACE ACCESSORIES": "Glasses",
    "GLASSES": "Glasses",
    "FASHION ACCESSORY": "FashionAccessory",
    "FASHION ACCESSORIES": "FashionAccessory",
    "FASHION": "FashionAccessory",
}

EC_LEGACY_CSS_SLOT_TO_NS_SLOT = {
    "weapon": "MainHand",
    "offhand": "OffHand",
    "head": "HeadGear",
    "body": "Body",
    "hands": "Hands",
    "legs": "Legs",
    "feet": "Feet",
    "ears": "Ears",
    "earrings": "Ears",
    "neck": "Neck",
    "necklace": "Neck",
    "wrists": "Wrists",
    "bracelets": "Wrists",
    "ring": "LeftRing",
    "face": "Glasses",
    "facewear": "Glasses",
    "fashion": "FashionAccessory",
}

EC_SLOT_ORDER = [
    "MainHand",
    "OffHand",
    "HeadGear",
    "Body",
    "Hands",
    "Legs",
    "Feet",
    "Ears",
    "Neck",
    "Wrists",
    "LeftRing",
    "RightRing",
    "Glasses",
    "FashionAccessory",
]

RS_SLOT_TO_NS_SLOT = {
    "MAIN_HAND": "MainHand",
    "OFF_HAND": "OffHand",
    "HEAD": "HeadGear",
    "BODY": "Body",
    "GLOVES": "Hands",
    "LEGS": "Legs",
    "FEET": "Feet",
    "EARS": "Ears",
    "NECK": "Neck",
    "WRISTS": "Wrists",
    "FINGER_LEFT": "LeftRing",
    "FINGER_RIGHT": "RightRing",
}

RS_SLOT_LABELS = {
    "MAIN_HAND": "主手",
    "OFF_HAND": "副手",
    "HEAD": "头部",
    "BODY": "上衣",
    "GLOVES": "手部",
    "LEGS": "腿部",
    "FEET": "脚部",
    "EARS": "耳坠",
    "NECK": "项链",
    "WRISTS": "手镯",
    "FINGER_LEFT": "戒指",
    "FINGER_RIGHT": "戒指",
}

TEXT_INPUT_NO_DYE_SLOTS = {"Ears", "Neck", "Wrists", "LeftRing", "RightRing", "Glasses", "FashionAccessory"}
TEXT_INPUT_SLOT_ALIASES = {
    "主手": "MainHand",
    "武器": "MainHand",
    "weapon": "MainHand",
    "main hand": "MainHand",
    "mainhand": "MainHand",
    "副手": "OffHand",
    "盾": "OffHand",
    "盾牌": "OffHand",
    "off hand": "OffHand",
    "offhand": "OffHand",
    "shield": "OffHand",
    "头部": "HeadGear",
    "头": "HeadGear",
    "头部防具": "HeadGear",
    "帽子": "HeadGear",
    "head": "HeadGear",
    "headgear": "HeadGear",
    "hat": "HeadGear",
    "身体": "Body",
    "身体防具": "Body",
    "上衣": "Body",
    "body": "Body",
    "chest": "Body",
    "top": "Body",
    "手臂": "Hands",
    "手部": "Hands",
    "手部防具": "Hands",
    "手套": "Hands",
    "hands": "Hands",
    "gloves": "Hands",
    "腿部": "Legs",
    "腿部防具": "Legs",
    "裤子": "Legs",
    "legs": "Legs",
    "pants": "Legs",
    "trousers": "Legs",
    "脚部": "Feet",
    "脚部防具": "Feet",
    "鞋": "Feet",
    "鞋子": "Feet",
    "feet": "Feet",
    "boots": "Feet",
    "shoes": "Feet",
    "耳部": "Ears",
    "耳饰": "Ears",
    "耳坠": "Ears",
    "ears": "Ears",
    "earrings": "Ears",
    "项链": "Neck",
    "颈部": "Neck",
    "neck": "Neck",
    "necklace": "Neck",
    "腕部": "Wrists",
    "手镯": "Wrists",
    "手腕": "Wrists",
    "wrists": "Wrists",
    "bracelets": "Wrists",
    "左指": "LeftRing",
    "左戒指": "LeftRing",
    "左手戒指": "LeftRing",
    "left ring": "LeftRing",
    "ring 1": "LeftRing",
    "右指": "RightRing",
    "右戒指": "RightRing",
    "右手戒指": "RightRing",
    "right ring": "RightRing",
    "ring 2": "RightRing",
    "戒指": "LeftRing",
    "ring": "LeftRing",
    "面部配饰": "Glasses",
    "脸部配饰": "Glasses",
    "眼镜": "Glasses",
    "facewear": "Glasses",
    "face wear": "Glasses",
    "glasses": "Glasses",
    "时尚配饰": "FashionAccessory",
    "时尚饰品": "FashionAccessory",
    "fashion accessory": "FashionAccessory",
    "fashion accessories": "FashionAccessory",
}

_mapping_data: Optional[Dict[str, Any]] = None
_mapping_mtime_ns: Optional[int] = None
_equipinfo_name_index: Dict[str, Any] = {}
_equipinfo_name_index_mtime_ns: Optional[int] = None
_risingstones_browser_process: Optional[subprocess.Popen] = None
_risingstones_browser_port: Optional[int] = None
_risingstones_browser_lock = threading.Lock()


class BasePathMiddleware:
    def __init__(self, wsgi_app, base_path: str):
        self.wsgi_app = wsgi_app
        self.base_path = base_path

    def __call__(self, environ, start_response):
        if self.base_path:
            environ["SCRIPT_NAME"] = self.base_path

        path_info = environ.get("PATH_INFO", "")
        if path_info == self.base_path:
            environ["PATH_INFO"] = "/"
        elif path_info.startswith(f"{self.base_path}/"):
            environ["PATH_INFO"] = path_info[len(self.base_path) :] or "/"

        return self.wsgi_app(environ, start_response)


def load_mapping() -> Dict[str, Any]:
    return json.loads(MAPPING_PATH.read_text(encoding="utf-8"))


def get_mapping() -> Dict[str, Any]:
    global _mapping_data
    global _mapping_mtime_ns

    current_mtime_ns = MAPPING_PATH.stat().st_mtime_ns
    if _mapping_data is None or _mapping_mtime_ns != current_mtime_ns:
        _mapping_data = load_mapping()
        _mapping_mtime_ns = current_mtime_ns
    return _mapping_data


def is_local_request() -> bool:
    return request.remote_addr in {"127.0.0.1", "::1"}


def is_chara_import_authorized() -> bool:
    return ENABLE_CHARA_IMPORT


def chara_import_error_response():
    return jsonify({"error": "chara import disabled"}), 404


def require_chara_import_access():
    if is_chara_import_authorized():
        return None
    return chara_import_error_response()


def resolve_chara_payload(chara: Dict[str, Any], filename: str) -> Dict[str, Any]:
    resolved = resolve_chara(chara, get_mapping())
    resolved["source_name"] = filename
    return resolved


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def clean_datamining_text(value: str) -> str:
    text = str(value or "")
    text = re.sub(r"<(?:SoftHyphen|Indent)\s*/>", "", text, flags=re.IGNORECASE)
    return text


def normalize_lookup_text(value: str) -> str:
    text = html.unescape(clean_datamining_text(value))
    text = text.replace("’", "'").replace("`", "'")
    text = re.sub(r"\s+", " ", text).strip().casefold()
    return text


def text_from_html(fragment: str) -> str:
    cleaned = re.sub(r"(?is)<(?:script|style)\b.*?</(?:script|style)>", " ", fragment)
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    return normalize_space(html.unescape(cleaned))


def get_html_attr(tag: str, attr_name: str) -> str:
    pattern = re.compile(
        rf"""\b{re.escape(attr_name)}\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))""",
        re.IGNORECASE,
    )
    match = pattern.search(tag)
    if not match:
        return ""
    return html.unescape(next((group for group in match.groups() if group is not None), ""))


def html_tag_has_classes(tag: str, required_classes: List[str]) -> bool:
    classes = set(get_html_attr(tag, "class").split())
    return all(class_name in classes for class_name in required_classes)


def iter_div_blocks(fragment: str, required_classes: List[str]):
    position = 0
    open_div_pattern = re.compile(r"<div\b[^>]*>", re.IGNORECASE)
    div_pattern = re.compile(r"</?div\b[^>]*>", re.IGNORECASE)

    while position < len(fragment):
        match = open_div_pattern.search(fragment, position)
        if not match:
            return
        if not html_tag_has_classes(match.group(0), required_classes):
            position = match.end()
            continue

        depth = 0
        for div_match in div_pattern.finditer(fragment, match.start()):
            if div_match.group(0).lower().startswith("</"):
                depth -= 1
            else:
                depth += 1
            if depth == 0:
                yield fragment[match.start() : div_match.end()]
                position = div_match.end()
                break
        else:
            return


def validate_ec_url(raw_url: str) -> str:
    url = str(raw_url or "").strip()
    if not url:
        raise ValueError("请输入 Eorzea Collection 幻化链接")

    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"https", "http"}:
        raise ValueError("只支持 Eorzea Collection 的 http/https 链接")
    if parsed.hostname != EC_ALLOWED_HOST:
        raise ValueError("只支持 ffxiv.eorzeacollection.com 的幻化链接")
    if not re.fullmatch(r"/glamour/\d+(?:/[^/?#]+)?/?", parsed.path):
        raise ValueError("链接不是有效的 Eorzea Collection glamour 投稿页")

    return urllib.parse.urlunparse(parsed._replace(fragment=""))


def is_ec_access_blocked_page(document: str) -> bool:
    text = normalize_space(text_from_html(document)).lower()
    return (
        "sorry, you have been blocked" in text
        or "you are unable to access eorzeacollection.com" in text
        or ("cloudflare" in text and "access denied" in text)
    )


def ec_access_blocked_error() -> ValueError:
    return ValueError(
        "Eorzea Collection 当前拒绝此服务器访问，暂时无法读取该链接。请稍后重试或使用装备文字导入。"
    )


def fetch_ec_html(raw_url: str) -> Tuple[str, str]:
    opener = urllib.request.build_opener(NoRedirectHandler)
    url = validate_ec_url(raw_url)

    for _ in range(4):
        request_obj = urllib.request.Request(url, headers={"User-Agent": EC_USER_AGENT})
        try:
            with opener.open(request_obj, timeout=12) as response:
                final_url = validate_ec_url(response.geturl())
                data = response.read(EC_MAX_HTML_BYTES + 1)
                if len(data) > EC_MAX_HTML_BYTES:
                    raise ValueError("Eorzea Collection 页面过大，已停止读取")
                charset = response.headers.get_content_charset() or "utf-8"
                document = data.decode(charset, errors="replace")
                if is_ec_access_blocked_page(document):
                    raise ec_access_blocked_error()
                return document, final_url
        except urllib.error.HTTPError as exc:
            if exc.code not in {301, 302, 303, 307, 308}:
                body = exc.read(EC_MAX_HTML_BYTES + 1)
                charset = exc.headers.get_content_charset() or "utf-8"
                if is_ec_access_blocked_page(body.decode(charset, errors="replace")):
                    raise ec_access_blocked_error() from exc
                raise ValueError(f"Eorzea Collection 返回错误：HTTP {exc.code}") from exc
            location = exc.headers.get("Location", "")
            if not location:
                raise ValueError("Eorzea Collection 返回了空跳转地址") from exc
            url = validate_ec_url(urllib.parse.urljoin(url, location))
        except urllib.error.URLError as exc:
            raise ValueError(f"无法读取 Eorzea Collection 页面：{exc.reason}") from exc

    raise ValueError("Eorzea Collection 页面跳转次数过多")


def extract_ec_title(document: str) -> str:
    title_match = re.search(r"(?is)<title\b[^>]*>(.*?)</title>", document)
    if not title_match:
        return ""
    title = text_from_html(title_match.group(1))
    return re.sub(r"\s*\|\s*Eorzea Collection\s*$", "", title).strip()


def extract_ec_divider_section(document: str, label: str) -> str:
    pattern = re.compile(
        rf"""(?is)<div\b[^>]*class=(?:"[^"]*\bdivider\b[^"]*"|'[^']*\bdivider\b[^']*')[^>]*>\s*{re.escape(label)}\s*</div>"""
    )
    start = pattern.search(document)
    if not start:
        return ""
    next_divider = re.search(
        r"""(?is)<div\b[^>]*class=(?:"[^"]*\bdivider\b[^"]*"|'[^']*\bdivider\b[^']*')[^>]*>""",
        document[start.end() :],
    )
    end = start.end() + next_divider.start() if next_divider else len(document)
    return document[start.end() : end]


def extract_ec_author(document: str) -> Dict[str, str]:
    section = extract_ec_divider_section(document, "Creator")
    name_match = re.search(r'(?is)<h3\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>(.*?)</h3>', section)
    world_match = re.search(r'(?is)<h4\b[^>]*class="[^"]*\bsubtitle\b[^"]*"[^>]*>(.*?)</h4>', section)
    name = text_from_html(name_match.group(1)) if name_match else ""
    world = text_from_html(world_match.group(1)) if world_match else ""
    if not name:
        legacy_match = re.search(
            r'(?is)<h2\b[^>]*class="[^"]*\bb-title-sub\b[^"]*"[^>]*>\s*by\s*<b\b[^>]*>(.*?)</b>\s*from\s*(.*?)</h2>',
            document,
        )
        if legacy_match:
            name = text_from_html(legacy_match.group(1))
            world = text_from_html(legacy_match.group(2))
    label_world = world.strip()
    world = world.replace("⧫", "").strip().strip("«»").strip()
    return {
        "name": name,
        "world": world,
        "label": " ".join(part for part in [name, label_world] if part).strip(),
    }


def extract_ec_character(document: str) -> Dict[str, str]:
    race_names = r"Hyur|Elezen|Lalafell|Miqo'?te|Roegadyn|Au Ra|Hrothgar|Viera"
    pattern = re.compile(rf"(?i)\b({race_names})\s+(Female|Male)\b")
    for match in pattern.finditer(text_from_html(document)):
        race = match.group(1).replace("Miqote", "Miqo'te")
        return {"race": race, "gender": match.group(2)}

    for image_match in re.finditer(r"(?is)<img\b[^>]*>", document):
        tag = image_match.group(0)
        classes = set(get_html_attr(tag, "class").split())
        if "c-set-fitting-icon" not in classes or "c-set-fitting-icon-unfit" in classes:
            continue
        gender_match = re.search(r"/genders/gender-(female|male)\.", get_html_attr(tag, "src"), flags=re.IGNORECASE)
        if gender_match:
            return {"race": "", "gender": gender_match.group(1).title()}
    return {"race": "", "gender": ""}


def parse_ec_icon_id(block: str) -> int:
    for image_match in re.finditer(r"(?is)<img\b[^>]*>", block):
        tag = image_match.group(0)
        classes = get_html_attr(tag, "class")
        if "gear-icon-image" not in classes and "b-info-box-item-icon" not in classes:
            continue
        src = get_html_attr(tag, "src")
        icon_match = re.search(r"/(\d{6})\.(?:png|jpg|webp)(?:\?|$)", src)
        if icon_match:
            return int(icon_match.group(1))
    return 0


def parse_ec_item_name(block: str) -> str:
    for image_match in re.finditer(r"(?is)<img\b[^>]*>", block):
        tag = image_match.group(0)
        if "gear-icon-image" in get_html_attr(tag, "class"):
            name = get_html_attr(tag, "alt")
            if name:
                return normalize_space(name)

    for title_block in iter_div_blocks(block, ["list-item-title"]):
        title = text_from_html(title_block)
        if title:
            return title

    legacy_name_match = re.search(
        r'(?is)<span\b[^>]*class="[^"]*\bc-gear-slot-item-name\b[^"]*"[^>]*>(.*?)</span>',
        block,
    )
    if legacy_name_match:
        return text_from_html(legacy_name_match.group(1))
    return ""


EMPTY_DYE_LOOKUP_TEXTS = {
    "",
    "undyed",
    "no dye",
    "no color",
    "no colour",
    "none",
    "no colour dye",
    "no color dye",
    "无染色",
    "無染色",
    "未染色",
    "染色なし",
    "染色無し",
    "無染色",
    "염색 없음",
    "염색 안 함",
    "염색안함",
    "염색 불가",
    "염색불가",
}


def is_empty_dye_text(value: str) -> bool:
    return normalize_lookup_text(value) in EMPTY_DYE_LOOKUP_TEXTS


def clean_ec_dye_name(value: str) -> str:
    text = normalize_space(value)
    text = re.sub(r"^[⬤●◯○\s]+", "", text).strip()
    if is_empty_dye_text(text):
        return "No Color"
    text = re.sub(r"(?:染剂|dye)\s*$", "", text, flags=re.IGNORECASE).strip()
    return "No Color" if is_empty_dye_text(text) else text


def is_empty_ec_dye_name(value: str) -> bool:
    return is_empty_dye_text(value) or is_empty_dye_text(clean_ec_dye_name(value))


def parse_ec_dyes(block: str) -> List[str]:
    dyes = []
    for tag_block in iter_div_blocks(block, ["tag"]):
        raw_dye = text_from_html(tag_block)
        if not raw_dye:
            continue
        dye = clean_ec_dye_name(raw_dye)
        if dye:
            dyes.append(dye)

    if not dyes:
        color_pattern = re.compile(
            r'(?is)<span\b[^>]*class="[^"]*\bc-gear-slot-item-info-color\b[^"]*"[^>]*>'
        )
        span_pattern = re.compile(r"(?is)</?span\b[^>]*>")
        position = 0
        while position < len(block):
            color_match = color_pattern.search(block, position)
            if not color_match:
                break
            depth = 0
            for span_match in span_pattern.finditer(block, color_match.start()):
                if span_match.group(0).lower().startswith("</"):
                    depth -= 1
                else:
                    depth += 1
                if depth == 0:
                    dye = clean_ec_dye_name(text_from_html(block[color_match.start() : span_match.end()]))
                    if dye:
                        dyes.append(dye)
                    position = span_match.end()
                    break
            else:
                break
    return dyes[:2]


def normalize_ec_slot(value: str) -> str:
    return re.sub(r"[\s_-]+", " ", str(value or "").strip().upper())


def extract_ec_legacy_equipment_section(document: str) -> str:
    marker = re.search(
        r'(?is)<span\b[^>]*class="[^"]*\bb-info-box-category-title\b[^"]*"[^>]*>\s*Equipment:\s*</span>',
        document,
    )
    if not marker:
        return ""
    start = document.rfind("<section", 0, marker.start())
    end = document.find("</section>", marker.end())
    if start < 0 or end < 0:
        return ""
    return document[start : end + len("</section>")]


def parse_ec_legacy_equipment(document: str) -> List[Dict[str, Any]]:
    section = extract_ec_legacy_equipment_section(document)
    if not section:
        return []

    entries = []
    generic_ring_count = 0
    for block in iter_div_blocks(section, ["b-info-box-item-wrapper"]):
        slot_class = ""
        for tag_match in re.finditer(r"(?is)<a\b[^>]*>", block):
            class_match = re.search(r"\bc-gear-slot-([a-z-]+)\b", get_html_attr(tag_match.group(0), "class"))
            if class_match:
                slot_class = class_match.group(1)
                break
        if not slot_class:
            continue

        slot_name = EC_LEGACY_CSS_SLOT_TO_NS_SLOT.get(slot_class)
        if slot_class == "ring":
            slot_name = "LeftRing" if generic_ring_count == 0 else "RightRing"
            generic_ring_count += 1
        if not slot_name:
            continue

        item_name = parse_ec_item_name(block)
        if not item_name:
            continue
        entries.append(
            {
                "slot": slot_name,
                "ec_slot": slot_class.upper(),
                "item_name": item_name,
                "dyes": parse_ec_dyes(block),
                "icon": parse_ec_icon_id(block),
            }
        )
    return entries


def parse_ec_equipment(document: str) -> List[Dict[str, Any]]:
    section = extract_ec_divider_section(document, "Equipment")

    entries = []
    generic_ring_count = 0
    if section:
        for block in iter_div_blocks(section, ["list", "box"]):
            slot_match = re.search(
                r'(?is)<span\b[^>]*class="[^"]*\bgear-icon-box-slot-name\b[^"]*"[^>]*>(.*?)</span>',
                block,
            )
            if not slot_match:
                continue
            slot_label = text_from_html(slot_match.group(1))
            normalized_slot = normalize_ec_slot(slot_label)
            slot_name = EC_SLOT_TO_NS_SLOT.get(normalized_slot)
            if normalized_slot == "RING":
                slot_name = "LeftRing" if generic_ring_count == 0 else "RightRing"
                generic_ring_count += 1
            if not slot_name:
                continue

            item_name = parse_ec_item_name(block)
            if not item_name:
                continue
            entries.append(
                {
                    "slot": slot_name,
                    "ec_slot": slot_label,
                    "item_name": item_name,
                    "dyes": parse_ec_dyes(block),
                    "icon": parse_ec_icon_id(block),
                }
            )
    else:
        entries = parse_ec_legacy_equipment(document)

    if not entries:
        raise ValueError("未在页面中识别到投影信息")

    order = {slot: index for index, slot in enumerate(EC_SLOT_ORDER)}
    entries.sort(key=lambda entry: order.get(entry["slot"], len(order)))
    return entries


def find_item_record_by_name(mapping: Dict[str, Any], item_name: str, slot_name: str) -> Optional[Dict[str, Any]]:
    normalized_name = normalize_lookup_text(item_name)
    fallback_matches = []

    for item in mapping.get("items", []):
        if slot_name and not item_matches_equipment_slot(item, slot_name):
            continue
        names = item.get("names") or {}
        all_names = [item.get("name", ""), *names.values()]
        normalized_names = {normalize_lookup_text(name) for name in all_names if name}
        if normalized_name in normalized_names:
            return dict(item)
        if any(normalized_name and normalized_name == name.replace("-", " ") for name in normalized_names):
            fallback_matches.append(item)

    return dict(fallback_matches[0]) if fallback_matches else None


def normalize_text_input_lookup(value: str) -> str:
    text = normalize_lookup_text(value)
    text = re.sub(r"[‐‑‒–—―\-－_＿·・•◆◇★☆※#＃]+", " ", text)
    text = re.sub(r"[\"“”'‘’`´]+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def compact_text_input_lookup(value: str) -> str:
    return re.sub(r"\s+", "", normalize_text_input_lookup(value))


def normalize_text_input_slot(value: str, mapping: Dict[str, Any], locale: str) -> str:
    text = normalize_space(str(value or ""))
    if not text:
        return ""
    normalized = normalize_text_input_lookup(text)
    compact = compact_text_input_lookup(text)
    for alias, slot in TEXT_INPUT_SLOT_ALIASES.items():
        if normalized == normalize_text_input_lookup(alias) or compact == compact_text_input_lookup(alias):
            return slot
    for slot, names in (mapping.get("slot_names") or DEFAULT_SLOT_NAMES).items():
        candidates = [slot, RESOLVER_SLOT_LABELS.get(slot, "")]
        if isinstance(names, dict):
            candidates.extend([names.get(locale, ""), *names.values()])
        for candidate in candidates:
            if not candidate:
                continue
            if normalized == normalize_text_input_lookup(candidate) or compact == compact_text_input_lookup(candidate):
                return slot
    return ""


def get_equipinfo_name_index(mapping: Dict[str, Any]) -> Dict[str, Any]:
    global _equipinfo_name_index
    global _equipinfo_name_index_mtime_ns

    current_mtime_ns = MAPPING_PATH.stat().st_mtime_ns
    if _equipinfo_name_index and _equipinfo_name_index_mtime_ns == current_mtime_ns:
        return _equipinfo_name_index

    by_locale: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for item in mapping.get("items", []):
        names = item.get("names") or {}
        for locale, name in names.items():
            normalized = compact_text_input_lookup(name)
            if normalized:
                by_locale.setdefault(locale, {}).setdefault(normalized, []).append(item)
        normalized_default = compact_text_input_lookup(item.get("name", ""))
        if normalized_default:
            by_locale.setdefault(DEFAULT_LOCALE, {}).setdefault(normalized_default, []).append(item)

    for slot, records, slot_label in (
        ("Glasses", (mapping.get("glasses") or {}).values(), RESOLVER_SLOT_LABELS.get("Glasses", "")),
        ("FashionAccessory", (mapping.get("ornaments") or {}).values(), RESOLVER_SLOT_LABELS.get("FashionAccessory", "")),
    ):
        for record in records:
            enriched = {**record, "slot_label": slot_label, "_equipinfo_slot": slot}
            names = enriched.get("names") or {}
            for locale, name in names.items():
                normalized = compact_text_input_lookup(name)
                if normalized:
                    by_locale.setdefault(locale, {}).setdefault(normalized, []).append(enriched)
            normalized_default = compact_text_input_lookup(enriched.get("name", ""))
            if normalized_default:
                by_locale.setdefault(DEFAULT_LOCALE, {}).setdefault(normalized_default, []).append(enriched)

    _equipinfo_name_index = {"by_locale": by_locale}
    _equipinfo_name_index_mtime_ns = current_mtime_ns
    return _equipinfo_name_index


def get_equipinfo_record_slot(record: Dict[str, Any]) -> str:
    explicit = str(record.get("_equipinfo_slot") or "")
    if explicit:
        return explicit
    slot_label = record.get("slot_label", "")
    if slot_label == RESOLVER_SLOT_LABELS.get("OffHand", "") and get_equip_slot_category(record) == 2:
        return "OffHand"
    for slot, label in RESOLVER_SLOT_LABELS.items():
        if label == slot_label and item_matches_equipment_slot(record, slot):
            return slot
    return ""


def find_equipinfo_record_by_text(
    mapping: Dict[str, Any],
    item_text: str,
    locale: str,
    slot_name: str = "",
) -> Optional[Dict[str, Any]]:
    normalized = compact_text_input_lookup(item_text)
    if not normalized:
        return None
    index = get_equipinfo_name_index(mapping)
    locale_index = (index.get("by_locale") or {}).get(locale) or {}
    fallback_index = (index.get("by_locale") or {}).get(DEFAULT_LOCALE) or {}
    matches = list(locale_index.get(normalized) or [])
    if locale != DEFAULT_LOCALE:
        matches.extend(fallback_index.get(normalized) or [])
    if not matches:
        for locale_index in (index.get("by_locale") or {}).values():
            matches.extend(locale_index.get(normalized) or [])
            if matches:
                break
    if slot_name:
        matches = [record for record in matches if item_matches_equipment_slot(record, slot_name)]
    if not matches:
        return None
    return dict(matches[0])


def split_text_input_dyes(value: str) -> List[str]:
    raw = normalize_space(str(value or ""))
    raw = re.sub(r"^(?:染色|染剂|染料|dyes?|colou?rs?)\s*[:：]\s*", "", raw, flags=re.IGNORECASE).strip()
    if is_empty_ec_dye_name(raw):
        return []
    parts = [
        clean_ec_dye_name(part)
        for part in re.split(r"\s*(?:[/／|｜、,，;+＋&＆])\s*", raw)
        if part and part.strip()
    ]
    parts = [part for part in parts if part]
    meaningful_parts = [part for part in parts if not is_empty_ec_dye_name(part)]
    if not meaningful_parts:
        return []
    return (parts if len(parts) > 1 else meaningful_parts)[:2]


def parse_text_input_item_and_dyes(value: str) -> Tuple[str, List[str]]:
    text = normalize_space(str(value or ""))
    if not text:
        return "", []

    inline_match = re.match(r"(?is)^(.+?)\s*(?:[|｜]\s*)?(?:染色|染剂|染料|dyes?|colou?rs?)\s*[:：]\s*(.+)$", text)
    if inline_match:
        return normalize_space(inline_match.group(1)), split_text_input_dyes(inline_match.group(2))

    bracket_pairs = {
        ")": "(",
        "）": "（",
        "]": "[",
        "】": "【",
    }
    close = text[-1:]
    open_char = bracket_pairs.get(close)
    if open_char:
        start = text.rfind(open_char)
        if start > 0:
            item = normalize_space(text[:start])
            dyes = split_text_input_dyes(text[start + 1 : -1])
            if item and dyes:
                return item, dyes
    return text, []


def is_text_input_dye_line(value: str, mapping: Dict[str, Any], locale: str) -> bool:
    text = normalize_space(str(value or ""))
    if not text:
        return False
    if re.match(r"^(?:[|｜]\s*)?(?:染色|染剂|染料|dyes?|colou?rs?)\s*[:：]", text, flags=re.IGNORECASE):
        return True
    if is_empty_ec_dye_name(text):
        return True
    if len(split_text_input_dyes(text)) > 1:
        return True
    return resolve_stain_id_by_name(mapping, text) > 0


def resolve_equipinfo_dye_ids(mapping: Dict[str, Any], dyes: List[str], warnings: List[str], line_number: int) -> List[int]:
    dye_ids = []
    for dye in dyes[:2]:
        if is_empty_ec_dye_name(dye):
            dye_ids.append(0)
            continue
        dye_id = resolve_stain_id_by_name(mapping, dye)
        if dye_id > 0:
            dye_ids.append(dye_id)
        elif dye and not is_empty_ec_dye_name(dye):
            warnings.append(f"第 {line_number} 行染剂未识别：{dye}")
    return dye_ids[:2]


def get_record_dye_count(record: Dict[str, Any], slot_name: str) -> int:
    if slot_name in TEXT_INPUT_NO_DYE_SLOTS:
        return 0
    return min(max(int(record.get("dye_count", 0) or 0), 0), 2)


def pad_dye_ids(dye_ids: List[int], dye_count: int) -> List[int]:
    padded = [int(value or 0) for value in dye_ids[:dye_count]]
    while len(padded) < dye_count:
        padded.append(0)
    return padded


def serialize_equipinfo_candidate(record: Dict[str, Any], slot_name: str) -> Dict[str, Any]:
    slot_label = RESOLVER_SLOT_LABELS.get(slot_name, record.get("slot_label", ""))
    return {
        **record,
        "name": record.get("names", {}).get(DEFAULT_LOCALE) or record.get("name", ""),
        "slot_label": slot_label,
        "key_label": record.get("key_label") or ("编号" if slot_name in {"Glasses", "FashionAccessory"} else "物品ID"),
        "is_emperor": record.get("is_emperor", False),
        "rarity": record.get("rarity", 1),
        "icon": record.get("icon", 0),
        "equip_slot_category": record.get("equip_slot_category", 0),
        "dye_count": get_record_dye_count(record, slot_name),
        "model_main": record.get("model_main") or {},
    }


def build_equipinfo_resolved_entry(
    item: Dict[str, Any],
    mapping: Dict[str, Any],
) -> Dict[str, Any]:
    slot_name = item["slot"]
    slot_label = RESOLVER_SLOT_LABELS[slot_name]
    raw_candidate = serialize_equipinfo_candidate(item["record"], slot_name)
    dye_count = int(raw_candidate.get("dye_count", 0) or 0)
    dye_ids = pad_dye_ids(item.get("dye_ids", []), dye_count)
    dye_id = dye_ids[0] if dye_ids else 0
    dye_id_2 = dye_ids[1] if len(dye_ids) > 1 else 0
    candidates = decorate_candidates([raw_candidate], dye_id, dye_id_2, mapping)
    candidate = candidates[0] if candidates else raw_candidate
    slot_names = get_slot_names(slot_name, mapping)

    model = build_model_from_candidate(slot_name, candidate)
    if model and slot_name in {"MainHand", "OffHand"}:
        lookup_key = f"{slot_label}|{model.get('set', 0)}|{model.get('base', 0)}|{model.get('variant', 0)}"
    elif model:
        lookup_key = f"{slot_label}|{model.get('base', 0)}|{model.get('variant', 0)}"
    else:
        lookup_key = f"TEXT|{slot_name}|{candidate.get('key', 0)}"

    return {
        "slot": slot_name,
        "slot_label": slot_label,
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, slot_name),
        "lookup_key": lookup_key,
        "model": model,
        "dye_id": dye_id,
        "dye_id_2": dye_id_2,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "source": {
            "site": "文本识别",
            "line_number": item.get("line_number", 0),
            "slot": item.get("raw_slot", ""),
            "item_name": item.get("raw_item", ""),
            "dyes": item.get("raw_dyes", []),
            "matched": True,
        },
    }


def parse_equipinfo_text_payload(text: str, source_locale: str, mapping: Dict[str, Any]) -> Dict[str, Any]:
    metadata = mapping.get("metadata", {})
    locales = metadata.get("locales", get_locales(mapping))
    locale = source_locale if source_locale in locales else metadata.get("default_locale", DEFAULT_LOCALE)
    warnings: List[str] = []
    parsed_items: List[Dict[str, Any]] = []
    last_item: Optional[Dict[str, Any]] = None
    pending_slot = ""
    pending_raw_slot = ""
    ring_count = 0

    for line_number, raw_line in enumerate(str(text or "").splitlines(), 1):
        line = normalize_space(raw_line.strip(" \t\r\n-•*"))
        if not line:
            continue

        standalone_slot = normalize_text_input_slot(line, mapping, locale)
        if standalone_slot:
            pending_slot = standalone_slot
            pending_raw_slot = line
            continue

        slot_name = ""
        raw_slot = ""
        item_text = line
        dye_texts: List[str] = []
        match = re.match(r"^(.{1,40}?)\s*[:：]\s*(.+)$", line)
        if match:
            possible_slot = normalize_text_input_slot(match.group(1), mapping, locale)
            if possible_slot:
                slot_name = possible_slot
                raw_slot = normalize_space(match.group(1))
                item_text = normalize_space(match.group(2))
            elif is_text_input_dye_line(line, mapping, locale):
                if last_item:
                    last_item["raw_dyes"].extend(split_text_input_dyes(match.group(2)))
                    last_item["dye_line_numbers"].append(line_number)
                else:
                    warnings.append(f"第 {line_number} 行染剂没有可归属的装备：{line}")
                continue

        if not slot_name and is_text_input_dye_line(line, mapping, locale):
            if last_item:
                last_item["raw_dyes"].extend(split_text_input_dyes(line))
                last_item["dye_line_numbers"].append(line_number)
            else:
                warnings.append(f"第 {line_number} 行染剂没有可归属的装备：{line}")
            continue

        if not slot_name and pending_slot:
            slot_name = pending_slot
            raw_slot = pending_raw_slot
            pending_slot = ""
            pending_raw_slot = ""

        item_text, inline_dyes = parse_text_input_item_and_dyes(item_text)
        dye_texts.extend(inline_dyes)
        if not item_text:
            continue

        record = find_equipinfo_record_by_text(mapping, item_text, locale, slot_name)
        if not record:
            warnings.append(f"第 {line_number} 行装备未识别：{item_text}")
            if slot_name:
                pending_slot = ""
                pending_raw_slot = ""
            continue

        inferred_slot = slot_name or get_equipinfo_record_slot(record)
        if not inferred_slot:
            warnings.append(f"第 {line_number} 行无法判断部位：{item_text}")
            continue
        if inferred_slot == "LeftRing" and raw_slot and normalize_text_input_slot(raw_slot, mapping, locale) == "LeftRing":
            inferred_slot = "LeftRing" if ring_count == 0 else "RightRing"
            ring_count += 1

        item = {
            "slot": inferred_slot,
            "raw_slot": raw_slot,
            "raw_item": item_text,
            "raw_dyes": dye_texts,
            "dye_line_numbers": [line_number],
            "record": record,
            "line_number": line_number,
        }
        parsed_items.append(item)
        last_item = item

    if not parsed_items:
        raise ValueError("没有识别到装备信息")

    for item in parsed_items:
        if item["slot"] in TEXT_INPUT_NO_DYE_SLOTS:
            item["dye_ids"] = []
            continue
        dye_line_number = item["dye_line_numbers"][-1] if item.get("dye_line_numbers") else item.get("line_number", 0)
        item["dye_ids"] = resolve_equipinfo_dye_ids(mapping, item.get("raw_dyes", []), warnings, dye_line_number)

    order = {slot: index for index, slot in enumerate(EC_SLOT_ORDER)}
    parsed_items.sort(key=lambda item: order.get(item["slot"], len(order)))
    return {
        "file_type": "文字信息识别",
        "source_name": "文本装备信息",
        "source_title": "文本装备信息",
        "source_locale": locale,
        "locales": locales,
        "default_locale": metadata.get("default_locale", DEFAULT_LOCALE),
        "locale_labels": metadata.get("locale_labels", {DEFAULT_LOCALE: "chs"}),
        "slot_names": mapping.get("slot_names", DEFAULT_SLOT_NAMES),
        "dye_labels": mapping.get("dye_labels", DEFAULT_DYE_LABELS),
        "no_dye_labels": build_no_dye_labels(mapping),
        "warnings": warnings,
        "resolved_equipment": [build_equipinfo_resolved_entry(item, mapping) for item in parsed_items],
    }


def resolve_stain_id_by_name(mapping: Dict[str, Any], dye_name: str) -> int:
    normalized_names = {
        normalize_lookup_text(clean_ec_dye_name(dye_name)),
        normalize_lookup_text(dye_name),
    }
    normalized_names.discard("")
    if is_empty_ec_dye_name(dye_name):
        return 0

    stains_by_locale = mapping.get("stains_by_locale") or {DEFAULT_LOCALE: mapping.get("stains", {})}
    for stains in stains_by_locale.values():
        for stain_id, stain_name in stains.items():
            if normalize_lookup_text(stain_name) in normalized_names or normalize_lookup_text(clean_ec_dye_name(stain_name)) in normalized_names:
                return int(stain_id)
    return 0


def known_stain_ids(mapping: Dict[str, Any]) -> Set[int]:
    stains_by_locale = mapping.get("stains_by_locale") or {DEFAULT_LOCALE: mapping.get("stains", {})}
    ids: Set[int] = set()
    for stains in stains_by_locale.values():
        for stain_id in stains.keys():
            try:
                ids.add(int(stain_id))
            except (TypeError, ValueError):
                continue
    return ids


def resolve_stain_id_by_hex(mapping: Dict[str, Any], color_hex: str) -> int:
    normalized = str(color_hex or "").strip().lower()
    if not re.fullmatch(r"#[0-9a-f]{6}", normalized):
        return 0
    matches = []
    for stain_id, color in (mapping.get("stain_colors") or {}).items():
        if str(color.get("hex", "")).strip().lower() == normalized:
            try:
                numeric_id = int(stain_id)
            except (TypeError, ValueError):
                continue
            if numeric_id > 0:
                matches.append(numeric_id)
    return matches[0] if len(matches) == 1 else 0


def build_fallback_ec_candidate(entry: Dict[str, Any], slot_label: str) -> Dict[str, Any]:
    return {
        "key": 0,
        "key_label": "EC",
        "name": entry["item_name"],
        "names": {
            DEFAULT_LOCALE: entry["item_name"],
            "en": entry["item_name"],
        },
        "rarity": 1,
        "is_emperor": False,
        "icon": entry.get("icon", 0),
        "equip_slot_category": 0,
        "slot_label": slot_label,
        "dye_count": min(len(entry.get("dyes", [])), 2),
        "model_main": {},
    }


def get_ec_variant_label(entry: Dict[str, Any]) -> str:
    if entry.get("slot") != "Glasses":
        return ""
    dyes = entry.get("dyes") if isinstance(entry.get("dyes"), list) else []
    for dye in dyes:
        label = clean_ec_dye_name(str(dye or ""))
        if label and not is_empty_ec_dye_name(label):
            return label
    return ""


def get_ec_normal_dyes(entry: Dict[str, Any]) -> List[str]:
    if entry.get("slot") == "Glasses":
        return []
    dyes = entry.get("dyes", []) if isinstance(entry.get("dyes"), list) else []
    normal_dyes = []
    for dye in dyes[:2]:
        if not normalize_space(str(dye or "")):
            continue
        cleaned = clean_ec_dye_name(str(dye))
        if cleaned:
            normal_dyes.append(cleaned)
    return normal_dyes


def find_item_record_by_id(mapping: Dict[str, Any], item_id: int, slot_name: str = "") -> Optional[Dict[str, Any]]:
    if item_id <= 0:
        return None
    fallback = None
    for item in mapping.get("items", []):
        if int(item.get("key", 0) or 0) != item_id:
            continue
        if slot_name and item_matches_equipment_slot(item, slot_name):
            return dict(item)
        if fallback is None:
            fallback = dict(item)
    return None if slot_name else fallback


def build_fallback_rs_candidate(entry: Dict[str, Any], slot_label: str) -> Dict[str, Any]:
    item_name = entry.get("item_name", "")
    item_id = int(entry.get("item_id", 0) or 0)
    return {
        "key": item_id,
        "key_label": "石之家装备ID",
        "name": item_name,
        "names": {
            DEFAULT_LOCALE: item_name,
        },
        "rarity": 1,
        "is_emperor": False,
        "icon": int(entry.get("icon", 0) or 0),
        "equip_slot_category": 0,
        "slot_label": slot_label,
        "dye_count": min(len(entry.get("dye_ids", [])), 2),
        "model_main": {},
    }


def build_model_from_candidate(slot_name: str, candidate: Dict[str, Any]) -> Dict[str, int]:
    model = candidate.get("model_main") or {}
    primary = int(model.get("primary", 0) or 0)
    secondary = int(model.get("secondary", 0) or 0)
    tertiary = int(model.get("tertiary", 0) or 0)
    if slot_name in {"MainHand", "OffHand"}:
        return {"set": primary, "base": secondary, "variant": tertiary}
    if primary or secondary:
        return {"base": primary, "variant": secondary}
    return {}


def build_ec_resolved_entry(entry: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    slot_name = entry["slot"]
    slot_label = RESOLVER_SLOT_LABELS[slot_name]
    record = find_item_record_by_name(mapping, entry["item_name"], slot_name)
    raw_candidate = record or build_fallback_ec_candidate(entry, slot_label)
    ec_variant_label = get_ec_variant_label(entry)
    normal_dyes = get_ec_normal_dyes(entry)
    raw_candidate = {
        **raw_candidate,
        "icon": raw_candidate.get("icon") or entry.get("icon", 0),
        "dye_count": get_record_dye_count(raw_candidate, slot_name),
        "ec_variant_label": ec_variant_label,
        "ec_variant_kind": "glasses-style" if ec_variant_label else "",
    }
    dye_ids = pad_dye_ids([resolve_stain_id_by_name(mapping, dye) for dye in normal_dyes], int(raw_candidate.get("dye_count", 0) or 0))
    dye_id = dye_ids[0] if dye_ids else 0
    dye_id_2 = dye_ids[1] if len(dye_ids) > 1 else 0
    candidates = decorate_candidates([raw_candidate], dye_id, dye_id_2, mapping)
    candidate = candidates[0] if candidates else raw_candidate
    slot_names = get_slot_names(slot_name, mapping)

    if record:
        model = build_model_from_candidate(slot_name, candidate)
        if slot_name in {"MainHand", "OffHand"}:
            lookup_key = f"{slot_label}|{model.get('set', 0)}|{model.get('base', 0)}|{model.get('variant', 0)}"
        else:
            lookup_key = f"{slot_label}|{model.get('base', 0)}|{model.get('variant', 0)}"
    else:
        model = {}
        lookup_key = f"EC|{slot_name}|{entry['item_name']}"

    return {
        "slot": slot_name,
        "slot_label": slot_label,
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, slot_name),
        "lookup_key": lookup_key,
        "model": model,
        "dye_id": dye_id,
        "dye_id_2": dye_id_2,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "source": {
            "site": "Eorzea Collection",
            "slot": entry.get("ec_slot", ""),
            "item_name": entry["item_name"],
            "dyes": entry.get("dyes", []),
            "ec_variant_label": ec_variant_label,
            "matched": bool(record),
        },
    }


def parse_ec_glamour_payload(document: str, url: str, mapping: Dict[str, Any]) -> Dict[str, Any]:
    metadata = mapping.get("metadata", {})
    title = extract_ec_title(document)
    author = extract_ec_author(document)
    character = extract_ec_character(document)
    equipment = parse_ec_equipment(document)

    return {
        "file_type": "Eorzea Collection",
        "source_name": title or url,
        "source_url": url,
        "source_title": title,
        "source_author": author.get("label", ""),
        "author": author,
        "race": character.get("race", ""),
        "gender": character.get("gender", ""),
        "locales": metadata.get("locales", get_locales(mapping)),
        "default_locale": metadata.get("default_locale", DEFAULT_LOCALE),
        "locale_labels": metadata.get("locale_labels", {DEFAULT_LOCALE: "chs"}),
        "slot_names": mapping.get("slot_names", DEFAULT_SLOT_NAMES),
        "dye_labels": mapping.get("dye_labels", DEFAULT_DYE_LABELS),
        "no_dye_labels": build_no_dye_labels(mapping),
        "resolved_equipment": [build_ec_resolved_entry(entry, mapping) for entry in equipment],
    }


def get_rs_text(value: Any) -> str:
    if value is None:
        return ""
    return normalize_space(str(value))


def get_rs_id(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def get_rs_equipment_name(equipment: Dict[str, Any]) -> str:
    for key in ("name", "equipment_name", "equip_name", "item_name", "itemName"):
        value = get_rs_text(equipment.get(key))
        if value:
            return value
    detail = equipment.get("detail") or equipment.get("equipment") or equipment.get("equipment_info") or {}
    if isinstance(detail, dict):
        for key in ("name", "equipment_name", "item_name"):
            value = get_rs_text(detail.get(key))
            if value:
                return value
    return ""


def get_rs_equipment_icon(equipment: Dict[str, Any]) -> int:
    for key in ("icon_id", "iconId", "icon"):
        icon = get_rs_id(equipment.get(key))
        if icon:
            return icon
    detail = equipment.get("detail") or equipment.get("equipment") or equipment.get("equipment_info") or {}
    if isinstance(detail, dict):
        for key in ("icon_id", "iconId", "icon"):
            icon = get_rs_id(detail.get(key))
            if icon:
                return icon
    return 0


def get_rs_equipment_id(equipment: Dict[str, Any]) -> int:
    for key in ("equipment_id", "equipmentId", "item_id", "itemId", "id"):
        item_id = get_rs_id(equipment.get(key))
        if item_id:
            return item_id
    detail = equipment.get("detail") or equipment.get("equipment") or equipment.get("equipment_info") or {}
    if isinstance(detail, dict):
        for key in ("id", "equipment_id", "item_id"):
            item_id = get_rs_id(detail.get(key))
            if item_id:
                return item_id
    return 0


def get_rs_dye_id_slots(equipment: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_dye_ids = equipment.get("dye_ids")
    raw_values: List[Any] = []
    if isinstance(raw_dye_ids, str):
        raw_values.extend(part for part in raw_dye_ids.split(",") if part.strip())
    elif isinstance(raw_dye_ids, list):
        raw_values.extend(raw_dye_ids)

    slots = []
    for value in raw_values[:2]:
        if isinstance(value, dict):
            slots.append(
                {
                    "id": get_rs_id(value.get("id")),
                    "name": get_rs_text(value.get("name")),
                    "color": get_rs_text(value.get("color") or value.get("hex")),
                }
            )
        else:
            slots.append({"id": get_rs_id(value)})
    return slots


def get_rs_dye_object_slots(equipment: Dict[str, Any]) -> List[Dict[str, Any]]:
    dyes = equipment.get("dyes")
    if not isinstance(dyes, list):
        return []

    slots = []
    for dye in dyes[:2]:
        if isinstance(dye, dict):
            slots.append(
                {
                    "id": get_rs_id(dye.get("id")),
                    "name": get_rs_text(dye.get("name")),
                    "color": get_rs_text(dye.get("color") or dye.get("hex")),
                }
            )
        else:
            slots.append({"id": get_rs_id(dye), "name": get_rs_text(dye), "color": ""})
    return slots


def merge_rs_dye_slot(target: Dict[str, Any], source: Dict[str, Any], replace_empty_id: bool = False) -> None:
    target_id = get_rs_id(target.get("id"))
    source_id = get_rs_id(source.get("id"))
    if replace_empty_id and target_id <= 0 and source_id > 0:
        target["id"] = source_id
        target_id = source_id
    if target_id > 0 and source_id > 0 and target_id != source_id:
        return
    if target_id <= 0 and source_id > 0:
        return
    if not get_rs_text(target.get("name")) and get_rs_text(source.get("name")):
        target["name"] = get_rs_text(source.get("name"))
    if not get_rs_text(target.get("color")) and get_rs_text(source.get("color")):
        target["color"] = get_rs_text(source.get("color"))


def get_rs_dye_slots(equipment: Dict[str, Any]) -> List[Dict[str, Any]]:
    id_slots = get_rs_dye_id_slots(equipment)
    object_slots = get_rs_dye_object_slots(equipment)
    if object_slots and len(object_slots) > len(id_slots):
        return object_slots[:2]

    slots = [dict(slot) for slot in id_slots]
    if not slots:
        slots = [dict(slot) for slot in object_slots]
    else:
        if len(object_slots) == len(slots):
            for index, object_slot in enumerate(object_slots):
                merge_rs_dye_slot(slots[index], object_slot)
        else:
            by_id = {get_rs_id(slot.get("id")): slot for slot in slots if get_rs_id(slot.get("id")) > 0}
            for object_slot in object_slots:
                matched_slot = by_id.get(get_rs_id(object_slot.get("id")))
                if matched_slot is not None:
                    merge_rs_dye_slot(matched_slot, object_slot)
    return slots[:2]


def get_rs_dye_ids(equipment: Dict[str, Any]) -> List[int]:
    return [get_rs_id(slot.get("id")) for slot in get_rs_dye_slots(equipment)]


def get_rs_dye_names(equipment: Dict[str, Any]) -> List[str]:
    return [get_rs_text(slot.get("name")) for slot in get_rs_dye_slots(equipment)]


def get_rs_dye_colors(equipment: Dict[str, Any]) -> List[str]:
    return [get_rs_text(slot.get("color")) for slot in get_rs_dye_slots(equipment)]


def parse_rs_equipment(detail: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_equipments = detail.get("equipments") or detail.get("equipment") or []
    if isinstance(raw_equipments, str):
        try:
            raw_equipments = json.loads(raw_equipments)
        except json.JSONDecodeError:
            raw_equipments = []
    if not isinstance(raw_equipments, list):
        raise ValueError("石之家详情里没有可识别的装备列表")

    entries = []
    for equipment in raw_equipments:
        if not isinstance(equipment, dict):
            continue
        rs_slot = get_rs_text(equipment.get("slot") or equipment.get("part_name")).upper()
        slot_name = RS_SLOT_TO_NS_SLOT.get(rs_slot)
        item_id = get_rs_equipment_id(equipment)
        if not slot_name or item_id <= 0:
            continue
        entries.append(
            {
                "slot": slot_name,
                "rs_slot": rs_slot,
                "rs_slot_label": RS_SLOT_LABELS.get(rs_slot, rs_slot),
                "item_id": item_id,
                "item_name": get_rs_equipment_name(equipment),
                "icon": get_rs_equipment_icon(equipment),
                "dye_ids": get_rs_dye_ids(equipment),
                "dye_names": get_rs_dye_names(equipment),
                "dye_colors": get_rs_dye_colors(equipment),
            }
        )

    if not entries:
        raise ValueError("未在石之家详情中识别到可导入装备")

    order = {slot: index for index, slot in enumerate(EC_SLOT_ORDER)}
    entries.sort(key=lambda entry: order.get(entry["slot"], len(order)))
    return entries


def build_rs_resolved_entry(entry: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    slot_name = entry["slot"]
    slot_label = RESOLVER_SLOT_LABELS[slot_name]
    record = find_item_record_by_id(mapping, entry.get("item_id", 0), slot_name)
    if not record and entry.get("item_name"):
        record = find_item_record_by_name(mapping, entry["item_name"], slot_name)

    raw_candidate = record or build_fallback_rs_candidate(entry, slot_label)
    raw_candidate = {
        **raw_candidate,
        "icon": raw_candidate.get("icon") or entry.get("icon", 0),
        "dye_count": get_record_dye_count(raw_candidate, slot_name),
    }
    stains = known_stain_ids(mapping)
    dye_count = int(raw_candidate.get("dye_count", 0) or 0)
    raw_dye_ids = entry.get("dye_ids", []) if isinstance(entry.get("dye_ids"), list) else []
    raw_dye_names = entry.get("dye_names", []) if isinstance(entry.get("dye_names"), list) else []
    raw_dye_colors = entry.get("dye_colors", []) if isinstance(entry.get("dye_colors"), list) else []
    dye_ids = []
    for index in range(min(dye_count, 2)):
        dye_id = get_rs_id(raw_dye_ids[index]) if index < len(raw_dye_ids) else 0
        if dye_id > 0 and dye_id not in stains:
            dye_id = 0
        if dye_id <= 0 and index < len(raw_dye_names):
            dye_id = resolve_stain_id_by_name(mapping, raw_dye_names[index])
        if dye_id <= 0 and index < len(raw_dye_colors):
            dye_id = resolve_stain_id_by_hex(mapping, raw_dye_colors[index])
        dye_ids.append(dye_id if dye_id > 0 else 0)
    dye_ids = pad_dye_ids(dye_ids, dye_count)
    dye_id = dye_ids[0] if dye_ids else 0
    dye_id_2 = dye_ids[1] if len(dye_ids) > 1 else 0
    candidates = decorate_candidates([raw_candidate], dye_id, dye_id_2, mapping)
    candidate = candidates[0] if candidates else raw_candidate
    slot_names = get_slot_names(slot_name, mapping)

    if record:
        model = build_model_from_candidate(slot_name, candidate)
        if slot_name in {"MainHand", "OffHand"}:
            lookup_key = f"{slot_label}|{model.get('set', 0)}|{model.get('base', 0)}|{model.get('variant', 0)}"
        else:
            lookup_key = f"{slot_label}|{model.get('base', 0)}|{model.get('variant', 0)}"
    else:
        model = {}
        lookup_key = f"RS|{slot_name}|{entry.get('item_id', 0)}"

    return {
        "slot": slot_name,
        "slot_label": slot_label,
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, slot_name),
        "lookup_key": lookup_key,
        "model": model,
        "dye_id": dye_id,
        "dye_id_2": dye_id_2,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "source": {
            "site": "石之家",
            "slot": entry.get("rs_slot_label", entry.get("rs_slot", "")),
            "item_id": entry.get("item_id", 0),
            "item_name": entry.get("item_name", ""),
            "dye_ids": dye_ids,
            "dyes": entry.get("dye_names", []),
            "dye_colors": entry.get("dye_colors", []),
            "matched": bool(record),
        },
    }


def get_rs_gender_label(value: Any) -> str:
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        return ""
    if numeric == 1:
        return "Male"
    if numeric == 2:
        return "Female"
    return ""


def get_rs_first_name(values: Any) -> str:
    if isinstance(values, list) and values:
        first = values[0]
        if isinstance(first, dict):
            return get_rs_text(first.get("name"))
        return get_rs_text(first)
    return ""


def parse_rs_glamour_payload(detail: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    metadata = mapping.get("metadata", {})
    title = get_rs_text(detail.get("title")) or f"石之家幻化 {detail.get('id', '')}".strip()
    author = " ".join(
        part
        for part in [
            get_rs_text(detail.get("character_name")),
            get_rs_text(detail.get("group_name")),
        ]
        if part
    )
    gender_ids = detail.get("gender_ids")
    gender = get_rs_gender_label(gender_ids[0] if isinstance(gender_ids, list) and gender_ids else gender_ids)
    equipment = parse_rs_equipment(detail)

    return {
        "file_type": "石之家",
        "source_name": title or "石之家幻化",
        "source_url": f"https://ff14risingstones.web.sdo.com/pc/index.html#/glamour/detail/{detail.get('id')}" if detail.get("id") else "",
        "source_title": title,
        "source_author": author,
        "author": {
            "name": get_rs_text(detail.get("character_name")),
            "world": get_rs_text(detail.get("group_name")),
            "label": author,
        },
        "race": get_rs_first_name(detail.get("race_ids")),
        "gender": gender,
        "locales": metadata.get("locales", get_locales(mapping)),
        "default_locale": metadata.get("default_locale", DEFAULT_LOCALE),
        "locale_labels": metadata.get("locale_labels", {DEFAULT_LOCALE: "chs"}),
        "slot_names": mapping.get("slot_names", DEFAULT_SLOT_NAMES),
        "dye_labels": mapping.get("dye_labels", DEFAULT_DYE_LABELS),
        "no_dye_labels": build_no_dye_labels(mapping),
        "resolved_equipment": [build_rs_resolved_entry(entry, mapping) for entry in equipment],
    }


def find_chromium_executable() -> str:
    candidates = [
        os.environ.get("NSGLAMOUR_CHROME_PATH", "").strip(),
        shutil.which("google-chrome"),
        shutil.which("google-chrome-stable"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        shutil.which("chrome"),
        shutil.which("chrome.exe"),
        shutil.which("msedge"),
        shutil.which("msedge.exe"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]
    for candidate in candidates:
        if candidate and (Path(candidate).exists() or shutil.which(candidate)):
            return candidate
    raise RuntimeError("没有找到 Chrome/Chromium/Edge，可设置 NSGLAMOUR_CHROME_PATH")


def devtools_json(path: str, port: Optional[int] = None, timeout: float = 2.5) -> Any:
    url = f"http://127.0.0.1:{port or RS_BROWSER_PORT}{path}"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"无法连接后台浏览器 DevTools: {exc}") from exc


def read_risingstones_browser_port() -> Optional[int]:
    if not RS_BROWSER_PORT_FILE.exists():
        return None
    try:
        data = json.loads(RS_BROWSER_PORT_FILE.read_text(encoding="utf-8"))
        port = int(data.get("port", 0))
        profile = str(data.get("profile", ""))
        if port > 0 and profile == str(RS_BROWSER_PROFILE_DIR):
            return port
    except Exception:
        return None
    return None


def write_risingstones_browser_port(port: int) -> None:
    RS_BROWSER_PORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    RS_BROWSER_PORT_FILE.write_text(
        json.dumps({"port": port, "profile": str(RS_BROWSER_PROFILE_DIR)}, ensure_ascii=False),
        encoding="utf-8",
    )


def is_devtools_alive(port: Optional[int] = None) -> bool:
    try:
        devtools_json("/json/version", port=port, timeout=0.6)
        return True
    except RuntimeError:
        return False


def get_risingstones_browser_user_agent(port: Optional[int] = None) -> str:
    try:
        payload = devtools_json("/json/version", port=port, timeout=1.0)
    except RuntimeError:
        return ""
    if not isinstance(payload, dict):
        return ""
    return str(payload.get("User-Agent", "") or "")


def is_risingstones_headless_browser(port: Optional[int] = None) -> bool:
    return "headlesschrome/" in get_risingstones_browser_user_agent(port).lower()


def find_open_local_port(preferred: int) -> int:
    if can_bind(preferred):
        return preferred
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def ensure_risingstones_browser(
    open_login: bool = False,
    prefer_headless: Optional[bool] = None,
    force_relaunch: bool = False,
) -> Dict[str, Any]:
    global _risingstones_browser_process
    global _risingstones_browser_port

    desired_headless = RS_BROWSER_HEADLESS if prefer_headless is None else bool(prefer_headless)
    with _risingstones_browser_lock:
        port = _risingstones_browser_port or read_risingstones_browser_port() or RS_BROWSER_PORT
        if force_relaunch:
            shutdown_risingstones_browser_locked(port)
            port = _risingstones_browser_port or read_risingstones_browser_port() or RS_BROWSER_PORT
        elif is_devtools_alive(port):
            _risingstones_browser_port = port
            if open_login:
                open_risingstones_browser_page(RS_GLAMOUR_HOME_URL, port)
            return {"ok": True, "port": port, "profile": str(RS_BROWSER_PROFILE_DIR)}

        executable = find_chromium_executable()
        RS_BROWSER_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        port = find_open_local_port(RS_BROWSER_PORT)
        args = [
            executable,
            f"--remote-debugging-port={port}",
            "--remote-debugging-address=127.0.0.1",
            f"--user-data-dir={RS_BROWSER_PROFILE_DIR}",
            "--no-first-run",
            "--no-default-browser-check",
            RS_GLAMOUR_HOME_URL,
        ]
        if desired_headless:
            args.insert(-1, "--headless=new")
            args.insert(-1, "--disable-gpu")
            args.insert(-1, "--disable-blink-features=AutomationControlled")
        if RS_BROWSER_NO_SANDBOX:
            args.insert(-1, "--no-sandbox")
            args.insert(-1, "--disable-dev-shm-usage")
        if RS_BROWSER_EXTRA_ARGS:
            args[-1:-1] = RS_BROWSER_EXTRA_ARGS
        _risingstones_browser_process = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        _risingstones_browser_port = port
        write_risingstones_browser_port(port)

    deadline = time.time() + 8
    while time.time() < deadline:
        if is_devtools_alive(port):
            if open_login:
                open_risingstones_browser_page(RS_GLAMOUR_HOME_URL, port)
            return {"ok": True, "port": port, "profile": str(RS_BROWSER_PROFILE_DIR)}
        time.sleep(0.2)
    raise RuntimeError("后台浏览器启动超时")


def open_risingstones_browser_page(url: str, port: Optional[int] = None) -> Dict[str, Any]:
    encoded = urllib.parse.quote(url, safe="")
    request_url = f"http://127.0.0.1:{port or RS_BROWSER_PORT}/json/new?{encoded}"
    request_obj = urllib.request.Request(request_url, method="PUT")
    try:
        with urllib.request.urlopen(request_obj, timeout=2.5) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"无法打开后台浏览器页面: {exc}") from exc


def get_risingstones_page_targets(port: Optional[int] = None) -> List[Dict[str, Any]]:
    targets = devtools_json("/json/list", port=port)
    if not isinstance(targets, list):
        return []
    return [
        target
        for target in targets
        if target.get("type") == "page" and str(target.get("webSocketDebuggerUrl", "")).startswith("ws://")
    ]


def get_risingstones_target_priority(target: Dict[str, Any]) -> Optional[Tuple[int, str]]:
    url = str(target.get("url", ""))
    if not url.startswith(RS_ALLOWED_ORIGIN):
        return None
    lowered = url.lower()
    if "/pc/index.html#/post" in lowered:
        return (0, lowered)
    if "/pc/index.html#/glamour/detail/" in lowered:
        return (1, lowered)
    if "/pc/index.html#/glamour" in lowered:
        return (2, lowered)
    if "/pc/index.html#" in lowered:
        return (3, lowered)
    if lowered.rstrip("/") == f"{RS_ALLOWED_ORIGIN.lower()}/glamour":
        return (9, lowered)
    return (4, lowered)


def select_risingstones_target(port: Optional[int] = None) -> Dict[str, Any]:
    ensure_risingstones_browser()
    targets = get_risingstones_page_targets(port)
    ranked_targets = [
        (priority, target)
        for target in targets
        for priority in [get_risingstones_target_priority(target)]
        if priority is not None
    ]
    if ranked_targets:
        ranked_targets.sort(key=lambda item: item[0])
        return ranked_targets[0][1]
    open_risingstones_browser_page(RS_GLAMOUR_HOME_URL, port)
    time.sleep(0.8)
    targets = get_risingstones_page_targets(port)
    ranked_targets = [
        (priority, target)
        for target in targets
        for priority in [get_risingstones_target_priority(target)]
        if priority is not None
    ]
    if ranked_targets:
        ranked_targets.sort(key=lambda item: item[0])
        return ranked_targets[0][1]
    login_urls = [str(target.get("url", "")) for target in targets if "login.u.sdo.com" in str(target.get("url", ""))]
    if login_urls:
        raise RuntimeError("后台浏览器还在登录页，请先在弹出的专用窗口完成石之家小号登录")
    raise RuntimeError("没有找到已登录的石之家后台页面，请先点“后台登录”")


def normalize_risingstones_user_agent(user_agent: str) -> str:
    value = str(user_agent or "").strip()
    if not value:
        return (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/149.0.0.0 Safari/537.36"
        )
    return re.sub(r"HeadlessChrome/", "Chrome/", value, flags=re.IGNORECASE)


def ws_masked_frame(payload: bytes) -> bytes:
    header = bytearray([0x81])
    length = len(payload)
    if length < 126:
        header.append(0x80 | length)
    elif length < 65536:
        header.extend([0x80 | 126, (length >> 8) & 0xFF, length & 0xFF])
    else:
        header.append(0x80 | 127)
        header.extend(length.to_bytes(8, "big"))
    mask = secrets.token_bytes(4)
    masked = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
    return bytes(header) + mask + masked


def ws_read_exact(sock: socket.socket, size: int) -> bytes:
    chunks = []
    remaining = size
    while remaining > 0:
        chunk = sock.recv(remaining)
        if not chunk:
            raise RuntimeError("DevTools WebSocket 连接已关闭")
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def ws_read_frame(sock: socket.socket) -> Tuple[int, bytes]:
    first = ws_read_exact(sock, 2)
    opcode = first[0] & 0x0F
    length = first[1] & 0x7F
    if length == 126:
        length = struct.unpack("!H", ws_read_exact(sock, 2))[0]
    elif length == 127:
        length = struct.unpack("!Q", ws_read_exact(sock, 8))[0]
    masked = bool(first[1] & 0x80)
    mask = ws_read_exact(sock, 4) if masked else b""
    payload = ws_read_exact(sock, length) if length else b""
    if masked:
        payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
    return opcode, payload


def devtools_ws_request(ws_url: str, message: Dict[str, Any], timeout: float = 20) -> Dict[str, Any]:
    parsed = urllib.parse.urlparse(ws_url)
    if parsed.hostname not in {"127.0.0.1", "localhost"}:
        raise RuntimeError("拒绝连接非本地 DevTools")
    port = parsed.port or 80
    key = base64.b64encode(secrets.token_bytes(16)).decode("ascii")
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    with socket.create_connection((parsed.hostname, port), timeout=timeout) as sock:
        sock.settimeout(timeout)
        request_text = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {parsed.hostname}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        sock.sendall(request_text.encode("ascii"))
        response = b""
        while b"\r\n\r\n" not in response:
            chunk = sock.recv(4096)
            if not chunk:
                raise RuntimeError("DevTools WebSocket 握手失败")
            response += chunk
        header = response.split(b"\r\n\r\n", 1)[0].decode("iso-8859-1")
        if " 101 " not in header.split("\r\n", 1)[0]:
            raise RuntimeError("DevTools WebSocket 握手被拒绝")
        accept = base64.b64encode(hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode("ascii")).digest()).decode("ascii")
        if accept not in header:
            raise RuntimeError("DevTools WebSocket 握手校验失败")

        sock.sendall(ws_masked_frame(json.dumps(message).encode("utf-8")))
        message_id = message.get("id")
        while True:
            opcode, payload = ws_read_frame(sock)
            if opcode == 8:
                raise RuntimeError("DevTools WebSocket 已关闭")
            if opcode == 9:
                sock.sendall(bytes([0x8A, 0x80]) + secrets.token_bytes(4))
                continue
            if opcode != 1:
                continue
            data = json.loads(payload.decode("utf-8"))
            if data.get("id") == message_id:
                return data


def shutdown_risingstones_browser_locked(port_hint: Optional[int] = None) -> None:
    global _risingstones_browser_process
    global _risingstones_browser_port

    port = port_hint or _risingstones_browser_port or read_risingstones_browser_port() or RS_BROWSER_PORT
    process = _risingstones_browser_process
    _risingstones_browser_process = None
    _risingstones_browser_port = None
    try:
        RS_BROWSER_PORT_FILE.unlink()
    except FileNotFoundError:
        pass
    except OSError:
        pass

    if process and process.poll() is None:
        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=3)
        except Exception:
            try:
                process.kill()
            except Exception:
                pass

    if is_devtools_alive(port):
        try:
            version = devtools_json("/json/version", port=port, timeout=1.0)
            ws_url = str(version.get("webSocketDebuggerUrl", "") or "") if isinstance(version, dict) else ""
            if ws_url:
                devtools_ws_request(
                    ws_url,
                    {
                        "id": 1,
                        "method": "Browser.close",
                    },
                    timeout=5,
                )
        except Exception:
            pass
        deadline = time.time() + 5
        while time.time() < deadline:
            if not is_devtools_alive(port):
                break
            time.sleep(0.2)


def should_retry_risingstones_headless_failure(
    port: Optional[int] = None,
    error: Any = None,
    failures: Optional[List[Dict[str, Any]]] = None,
) -> bool:
    if not is_risingstones_headless_browser(port):
        return False
    messages: List[str] = []
    if error:
        messages.append(str(error))
    if failures:
        for failure in failures:
            if isinstance(failure, dict):
                messages.append(str(failure.get("message", "") or ""))
    for message in messages:
        lowered = message.strip().lower()
        if "failed to fetch" in lowered or "networkerror" in lowered or "err_" in lowered:
            return True
    return False


def get_risingstones_cookies_via_devtools(ws_url: str) -> List[Dict[str, Any]]:
    result = devtools_ws_request(
        ws_url,
        {
            "id": 1,
            "method": "Network.getCookies",
            "params": {
                "urls": [
                    RS_ALLOWED_ORIGIN,
                    RS_GLAMOUR_HOME_URL,
                    RS_API_BASE,
                ]
            },
        },
        timeout=10,
    )
    if result.get("error"):
        raise RuntimeError(result["error"].get("message") or "后台浏览器 Cookie 读取失败")
    cookies = result.get("result", {}).get("cookies")
    if not isinstance(cookies, list):
        raise RuntimeError("后台浏览器没有返回有效 Cookie")
    return [cookie for cookie in cookies if isinstance(cookie, dict) and cookie.get("name")]


def build_risingstones_cookie_header(cookies: List[Dict[str, Any]]) -> str:
    parts: List[str] = []
    for cookie in cookies:
        name = str(cookie.get("name", "") or "").strip()
        if not name:
            continue
        value = str(cookie.get("value", "") or "")
        parts.append(f"{name}={value}")
    return "; ".join(parts)


def build_risingstones_api_url(path: str, params: Optional[Dict[str, Any]] = None) -> str:
    url = urllib.parse.urljoin(RS_API_BASE, path)
    parsed = urllib.parse.urlparse(url)
    query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    for key, value in (params or {}).items():
        if value is None or value == "":
            continue
        query.append((str(key), str(value)))
    query.append(("tempsuid", secrets.token_hex(16)))
    return urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(query)))


def parse_risingstones_api_payload(
    raw_body: bytes,
    *,
    status_code: int,
    path: str,
    extra_codes: Optional[Set[str]] = None,
) -> Any:
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"石之家接口返回了无法解析的数据: {path}") from exc
    if not isinstance(payload, dict):
        raise RuntimeError(f"石之家接口返回格式异常: {path}")
    code = str(payload.get("code", payload.get("Code", "")) or "")
    message = str(payload.get("msg") or payload.get("message") or payload.get("Message") or "").strip()
    success_codes = {"10000", "10002"}
    if extra_codes:
        success_codes.update(str(item) for item in extra_codes)
    if not (200 <= status_code < 300):
        raise RuntimeError(message or f"石之家接口错误: {status_code}")
    if code and code not in success_codes:
        raise RuntimeError(message or f"石之家接口错误: {code}")
    return payload.get("data")


def fetch_risingstones_api_via_browser_cookies(
    path: str,
    *,
    ws_url: str,
    browser_port: Optional[int] = None,
    params: Optional[Dict[str, Any]] = None,
    extra_codes: Optional[Set[str]] = None,
) -> Any:
    cookies = get_risingstones_cookies_via_devtools(ws_url)
    cookie_header = build_risingstones_cookie_header(cookies)
    if not cookie_header:
        raise RuntimeError("后台浏览器里没有可用的石之家 Cookie，请重新登录小号")
    url = build_risingstones_api_url(path, params)
    request_obj = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json, text/plain, */*",
            "Cookie": cookie_header,
            "Origin": RS_ALLOWED_ORIGIN,
            "Referer": RS_GLAMOUR_HOME_URL,
            "User-Agent": normalize_risingstones_user_agent(get_risingstones_browser_user_agent(browser_port)),
        },
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=20) as response:
            body = response.read()
            status_code = int(getattr(response, "status", response.getcode()))
    except urllib.error.HTTPError as exc:
        body = exc.read()
        status_code = int(exc.code)
    except Exception as exc:
        raise RuntimeError(f"石之家接口请求失败: {exc}") from exc
    return parse_risingstones_api_payload(body, status_code=status_code, path=path, extra_codes=extra_codes)


def read_risingstones_details_via_http(ids: List[str], *, ws_url: str, browser_port: Optional[int] = None) -> Dict[str, Any]:
    fetch_risingstones_api_via_browser_cookies(
        "GHome/isLogin",
        ws_url=ws_url,
        browser_port=browser_port,
        extra_codes={"10103", "10104"},
    )
    details = []
    failures = []
    for glamour_id in ids:
        try:
            detail = fetch_risingstones_api_via_browser_cookies(
                "glamour/glamourDetail",
                ws_url=ws_url,
                browser_port=browser_port,
                params={"id": glamour_id},
            )
            details.append(detail)
        except RuntimeError as exc:
            failures.append({"id": glamour_id, "message": str(exc)})
    return {
        "ok": True,
        "ids": ids,
        "details": details,
        "failures": failures,
        "page": RS_GLAMOUR_HOME_URL,
        "mode": "http",
    }


def extract_risingstones_glamour_ids(value: str) -> List[str]:
    text = str(value or "").strip()
    if not text:
        return []
    ids: List[str] = []
    patterns = [
        r"[#/](?:glamour|publish/glamour)/detail/(\d+)",
        r"[?&](?:id|glamour_id|glamourId)=(\d+)",
        r"(?:^|\D)(\d{4,})(?=\D|$)",
    ]
    for pattern in patterns:
        ids.extend(re.findall(pattern, text, flags=re.IGNORECASE))
    return list(dict.fromkeys(ids))


def risingstones_fetch_expression(ids: List[str]) -> str:
    return f"""(async () => {{
  const ids = {json.dumps(ids)};
  const API_BASE = {json.dumps(RS_API_BASE)};
  const SUCCESS_CODES = new Set(["10000", "10002"]);
  const uuid = () => globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {{
        const value = Math.random() * 16 | 0;
        return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
      }});
  const codeOf = (payload) => String(payload?.code ?? payload?.Code ?? "");
  const messageOf = (payload) => String(payload?.msg || payload?.message || payload?.Message || "");
  const ok = (payload, extra = []) => {{
    const code = codeOf(payload);
    return SUCCESS_CODES.has(code) || extra.map(String).includes(code) || (!code && payload && "data" in payload);
  }};
  async function api(path, params = {{}}, extraCodes = []) {{
    const url = new URL(API_BASE + path);
    Object.entries({{ ...params, tempsuid: uuid() }}).forEach(([key, value]) => {{
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    }});
    const response = await fetch(url, {{
      credentials: "include",
      headers: {{ Accept: "application/json, text/plain, */*" }},
    }});
    const payload = await response.json();
    if (!response.ok || !ok(payload, extraCodes)) {{
      throw new Error(messageOf(payload) || `石之家接口错误: ${{codeOf(payload) || response.status}}`);
    }}
    return payload.data;
  }}
  await api("GHome/isLogin", {{}}, ["10103", "10104"]);
  const details = [];
  const failures = [];
  for (const id of ids) {{
    try {{
      details.push(await api("glamour/glamourDetail", {{ id }}));
    }} catch (error) {{
      failures.push({{ id, message: error?.message || "读取失败" }});
    }}
  }}
  return {{ ok: true, ids, details, failures, page: location.href }};
}})()"""


def read_risingstones_details_via_browser(ids: List[str]) -> Dict[str, Any]:
    if not ids:
        raise ValueError("没有识别到石之家详情 ID")
    attempts = [RS_BROWSER_HEADLESS]
    if RS_BROWSER_HEADLESS and RS_BROWSER_ALLOW_HEADED_FALLBACK:
        attempts.append(False)
    last_error: Optional[RuntimeError] = None

    for attempt_index, use_headless in enumerate(attempts):
        state = ensure_risingstones_browser(
            prefer_headless=use_headless,
            force_relaunch=attempt_index > 0,
        )
        port = state.get("port")
        try:
            target = select_risingstones_target(port)
            ws_url = target.get("webSocketDebuggerUrl")
            if not ws_url:
                raise RuntimeError("后台浏览器没有 DevTools 连接")
            http_result = read_risingstones_details_via_http(ids, ws_url=ws_url, browser_port=port)
            http_failures = http_result.get("failures") if isinstance(http_result.get("failures"), list) else []
            if http_result.get("details") or not http_failures:
                return http_result
            if attempt_index == 0 and should_retry_risingstones_headless_failure(port=port, failures=http_failures):
                continue
            expression = risingstones_fetch_expression(ids)
            result = devtools_ws_request(
                ws_url,
                {
                    "id": 1,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": expression,
                        "awaitPromise": True,
                        "returnByValue": True,
                        "timeout": 30000,
                    },
                },
                timeout=35,
            )
            if result.get("error"):
                raise RuntimeError(result["error"].get("message") or "后台浏览器执行失败")
            payload = result.get("result", {})
            exception = payload.get("exceptionDetails")
            if exception:
                text = exception.get("text") or exception.get("exception", {}).get("description") or "后台浏览器读取失败"
                raise RuntimeError(text)
            value = payload.get("result", {}).get("value")
            if not isinstance(value, dict):
                raise RuntimeError("后台浏览器没有返回有效数据")
            failures = value.get("failures") if isinstance(value.get("failures"), list) else []
            if attempt_index == 0 and should_retry_risingstones_headless_failure(port=port, failures=failures):
                continue
            return value
        except RuntimeError as exc:
            last_error = exc
            if attempt_index == 0 and should_retry_risingstones_headless_failure(port=port, error=exc):
                continue
            raise

    if last_error:
        raise last_error
    raise RuntimeError("后台浏览器读取失败")


def read_risingstones_reader_token() -> str:
    try:
        token = RS_REMOTE_READER_TOKEN_FILE.read_text(encoding="utf-8").strip()
    except OSError as exc:
        raise RuntimeError("石之家远程读取器鉴权文件不可用") from exc
    if not token:
        raise RuntimeError("石之家远程读取器鉴权文件为空")
    return token


def read_risingstones_details_via_remote_reader(ids: List[str]) -> Dict[str, Any]:
    if not RS_REMOTE_READER_URL:
        raise RuntimeError("石之家远程读取器未配置")
    parsed = urllib.parse.urlparse(RS_REMOTE_READER_URL)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise RuntimeError("石之家远程读取器地址无效")
    body = json.dumps({"ids": ids}, ensure_ascii=False).encode("utf-8")
    request_obj = urllib.request.Request(
        f"{RS_REMOTE_READER_URL}/v1/glamour-detail",
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {read_risingstones_reader_token()}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=45) as response:
            raw_body = response.read(RS_REMOTE_READER_MAX_BYTES + 1)
            status_code = int(getattr(response, "status", response.getcode()))
    except urllib.error.HTTPError as exc:
        raw_body = exc.read(RS_REMOTE_READER_MAX_BYTES + 1)
        status_code = int(exc.code)
    except Exception as exc:
        raise RuntimeError(f"石之家远程读取器请求失败: {exc}") from exc
    if len(raw_body) > RS_REMOTE_READER_MAX_BYTES:
        raise RuntimeError("石之家远程读取器响应过大")
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as exc:
        raise RuntimeError("石之家远程读取器返回了无法解析的数据") from exc
    if not isinstance(payload, dict):
        raise RuntimeError("石之家远程读取器返回格式异常")
    if not (200 <= status_code < 300) or payload.get("ok") is False:
        message = str(payload.get("error") or f"HTTP {status_code}")
        raise RuntimeError(f"石之家远程读取器失败: {message}")
    details = payload.get("details")
    failures = payload.get("failures")
    returned_ids = [str(item) for item in (payload.get("ids") or [])]
    if returned_ids != [str(item) for item in ids]:
        raise RuntimeError("石之家远程读取器返回的详情 ID 不匹配")
    if not isinstance(details, list) or not isinstance(failures, list):
        raise RuntimeError("石之家远程读取器缺少详情数据")
    return {
        "ok": True,
        "ids": ids,
        "details": [item for item in details if isinstance(item, dict)],
        "failures": [item for item in failures if isinstance(item, dict)],
        "page": RS_GLAMOUR_HOME_URL,
        "mode": "remote-reader",
    }


def read_risingstones_details(ids: List[str]) -> Dict[str, Any]:
    if RS_REMOTE_READER_URL:
        try:
            return read_risingstones_details_via_remote_reader(ids)
        except RuntimeError:
            if RS_REMOTE_READER_REQUIRED:
                raise
    return read_risingstones_details_via_browser(ids)


app = Flask(
    __name__,
    template_folder=str(TEMPLATES_DIR),
    static_folder=str(STATIC_DIR),
)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = STATIC_CACHE_SECONDS
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["MAX_CONTENT_LENGTH"] = MAX_CHARA_UPLOAD_MB * 1024 * 1024
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
if BASE_PATH:
    app.wsgi_app = BasePathMiddleware(app.wsgi_app, BASE_PATH)
register_snapshot_routes(app, EquipmentSnapshotStore(SNAPSHOT_DB_PATH))


@app.after_request
def add_no_cache_headers(response):
    is_cacheable_response = 200 <= response.status_code < 400
    if is_cacheable_response and (request.path.startswith("/static/") or request.path.startswith("/font/")):
        response.headers["Cache-Control"] = f"public, max-age={STATIC_CACHE_SECONDS}, immutable"
        response.headers.pop("Pragma", None)
        response.headers.pop("Expires", None)
    elif is_cacheable_response and request.path.startswith("/api/icon/"):
        response.headers["Cache-Control"] = f"public, max-age={ICON_CACHE_SECONDS}"
        response.headers.pop("Pragma", None)
        response.headers.pop("Expires", None)
    elif is_cacheable_response and request.path.startswith("/api/stains"):
        response.headers["Cache-Control"] = f"public, max-age={REFERENCE_DATA_CACHE_SECONDS}"
        response.headers.pop("Pragma", None)
        response.headers.pop("Expires", None)
    else:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    script_src = "script-src 'self' 'unsafe-inline'"
    connect_src = "connect-src 'self'"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "object-src 'none'; "
        "frame-ancestors 'self'; "
        "form-action 'self'; "
        "img-src 'self' data: blob:; "
        "font-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        f"{script_src}; "
        f"{connect_src}"
    )
    return response


@app.get("/robots.txt")
def robots_txt():
    return """User-agent: *
Disallow: /
""", {"Content-Type": "text/plain"}


@app.get("/")
def index():
    return redirect(url_for("template_workspace"))


@app.get("/template")
def template_workspace():
    return render_template("template.html", link_import_enabled=LINK_IMPORT_ENABLED)


@app.get("/equipinfo")
def equipinfo_workspace():
    return render_template(
        "equipinfo.html",
        chara_import_enabled=is_chara_import_authorized(),
        max_chara_upload_mb=MAX_CHARA_UPLOAD_MB,
        link_import_enabled=LINK_IMPORT_ENABLED,
    )


@app.get("/equipinfo/<snapshot_id>")
def equipinfo_snapshot(snapshot_id: str):
    return render_template("equipinfo-snapshot.html", snapshot_id=snapshot_id)


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


def humanize_risingstones_error(error: Any) -> str:
    message = str(error or "").strip()
    if not message:
        return "石之家读取失败。请确认后台浏览器已经登录石之家，并重新尝试。"
    for pattern, readable in RS_READABLE_ERROR_PATTERNS:
        if pattern.search(message):
            return readable
    return f"石之家读取失败：{message}"


def risingstones_error_response(error: Any, status: int = 502):
    message = humanize_risingstones_error(error)
    raw_message = str(error or "").strip()
    payload = {"error": message}
    if INCLUDE_DEBUG_ERRORS and raw_message and raw_message != message:
        payload["debug_error"] = raw_message
    return jsonify(payload), status


@app.get("/api/ui-localization")
def ui_localization():
    if not UI_LOCALIZATION_PATH.exists():
        abort(404)
    response = send_file(UI_LOCALIZATION_PATH, mimetype="application/json")
    response.headers["Cache-Control"] = "no-store"
    return response


@app.post("/api/import-glamour-link")
def import_glamour_link():
    if not LINK_IMPORT_ENABLED:
        return jsonify({"error": "网页链接导入暂时关闭"}), 503
    payload = request.get_json(silent=True, cache=True) or {}
    raw_url = str(payload.get("url", "") or payload.get("target", "")).strip()
    if raw_url and not re.match(r"^[a-z][a-z0-9+.-]*://", raw_url, flags=re.IGNORECASE):
        raw_url = f"https://{raw_url}"
    try:
        parsed_url = urllib.parse.urlparse(raw_url)
        host = parsed_url.hostname or ""
    except Exception:
        host = ""

    if host == "ff14risingstones.web.sdo.com":
        ids = extract_risingstones_glamour_ids(raw_url)
        if not ids:
            return jsonify({"error": "没有识别到石之家详情 ID"}), 400
        if len(ids) > 1:
            return jsonify({"error": "一次只能载入一条石之家幻化链接"}), 400
        try:
            result = read_risingstones_details(ids)
        except ValueError as exc:
            return risingstones_error_response(exc, 400)
        except RuntimeError as exc:
            return risingstones_error_response(exc, 502)
        details = [detail for detail in (result.get("details") or []) if isinstance(detail, dict)]
        if not details:
            failures = result.get("failures") if isinstance(result.get("failures"), list) else []
            message = failures[0].get("message") if failures and isinstance(failures[0], dict) else ""
            return risingstones_error_response(message or "没有读到石之家幻化详情", 502)
        try:
            return jsonify(parse_rs_glamour_payload(details[0], get_mapping()))
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    return jsonify({"error": "只支持石之家幻化详情链接"}), 400


@app.post("/api/equipinfo/parse-text")
def equipinfo_parse_text():
    payload = request.get_json(silent=True, cache=True) or {}
    text = str(payload.get("text", "") or "").strip()
    source_locale = str(payload.get("source_locale", "") or payload.get("locale", "") or DEFAULT_LOCALE).strip()
    if not text:
        return jsonify({"error": "请输入装备文字"}), 400
    if len(text) > 20000:
        return jsonify({"error": "文本过长，一次最多 20000 字"}), 413
    try:
        return jsonify(parse_equipinfo_text_payload(text, source_locale, get_mapping()))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/risingstones-browser/open-login")
def risingstones_browser_open_login():
    if not is_local_request():
        abort(404)
    error = require_chara_import_access()
    if error:
        return error
    try:
        state = ensure_risingstones_browser(open_login=True)
        return jsonify({
            "ok": True,
            "url": RS_GLAMOUR_HOME_URL,
            "port": state.get("port"),
            "profile": state.get("profile"),
        })
    except RuntimeError as exc:
        return risingstones_error_response(exc, 500)


@app.get("/font/<path:filename>")
def font_file(filename: str):
    target = (FONT_DIR / filename).resolve()
    try:
        target.relative_to(FONT_DIR.resolve())
    except ValueError:
        abort(404)
    if not target.is_file():
        abort(404)
    suffix = target.suffix.lower()
    if suffix not in {".ttf", ".otf", ".woff", ".woff2", ".ttc"}:
        abort(404)
    mimetype = {
        ".ttc": "font/collection",
        ".ttf": "font/ttf",
        ".otf": "font/otf",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
    }.get(suffix)
    return send_file(target, mimetype=mimetype)


@app.get("/template-preview/<path:filename>")
def template_preview(filename: str):
    target = (TEMPLATES_DIR / filename).resolve()
    try:
        target.relative_to(TEMPLATES_DIR.resolve())
    except ValueError:
        abort(404)
    if not target.is_file():
        abort(404)
    suffix = target.suffix.lower()
    mimetype = {"webp": "image/webp"}.get(suffix.lstrip(".")) or None
    return send_file(target, mimetype=mimetype)


@app.get("/api/icon/<int:icon_id>")
def icon(icon_id: int):
    if icon_id <= 0:
        abort(404)

    icon_name = str(icon_id).zfill(6)
    folder = f"{icon_name[:3]}000"
    cache_dir = ICON_CACHE_DIR / folder
    cache_path = cache_dir / f"{icon_name}_hr1.png"
    if cache_path.is_file():
        return send_file(cache_path, mimetype="image/png")

    icon_url = f"{ICON_BASE_URL}/{folder}/{icon_name}_hr1.png"
    try:
        with urllib.request.urlopen(icon_url, timeout=8) as response:
            data = response.read(ICON_MAX_BYTES + 1)
    except (urllib.error.URLError, TimeoutError):
        abort(404)
    if len(data) > ICON_MAX_BYTES:
        abort(502)
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        abort(502)

    temp_path = cache_path.with_suffix(f".{secrets.token_hex(6)}.tmp")
    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
        temp_path.write_bytes(data)
        os.replace(temp_path, cache_path)
    except OSError:
        try:
            temp_path.unlink(missing_ok=True)
        except OSError:
            pass

    return send_file(BytesIO(data), mimetype="image/png")


def localized_name(record: Dict[str, Any], locale: str) -> str:
    names = record.get("names") or {}
    return clean_datamining_text(names.get(locale) or names.get("zh") or record.get("name", "") or "")


def should_search_english_fallback(query: str, locale: str) -> bool:
    if (locale or "").casefold().startswith("en"):
        return True
    return len(query) >= 2 and bool(re.search(r"[a-z]", query))


def record_matches_query(record: Dict[str, Any], query: str, locale: str) -> bool:
    """Only match current locale name + English fallback — NOT all languages."""
    if query in str(record.get("key", "")):
        return True
    names = record.get("names") or {}
    locale_name = str(names.get(locale, "")).casefold()
    if query in locale_name:
        return True
    if not should_search_english_fallback(query, locale):
        return False
    en_name = str(names.get("en", "")).casefold()
    if en_name and query in en_name:
        return True
    return False


def search_score(record: Dict[str, Any], query: str, locale: str) -> int:
    """Lower = better. Current locale gets priority over English fallback."""
    key = str(record.get("key", ""))
    if key == query:
        return 0

    names = record.get("names") or {}
    locale_name = str(names.get(locale, "")).casefold()
    en_name = str(names.get("en", "")).casefold()

    if locale_name == query:
        return 1
    if locale_name.startswith(query):
        return 2
    if should_search_english_fallback(query, locale) and en_name == query:
        return 3
    if should_search_english_fallback(query, locale) and en_name.startswith(query):
        return 4
    return 5


def serialize_search_record(record: Dict[str, Any], locale: str, key_label: str = "物品ID") -> Dict[str, Any]:
    return {
        "key": record.get("key", 0),
        "key_label": record.get("key_label") or key_label,
        "name": localized_name(record, locale),
        "names": {
            name_locale: clean_datamining_text(name)
            for name_locale, name in (record.get("names") or {}).items()
            if name
        },
        "icon": record.get("icon", 0),
        "rarity": record.get("rarity", 1),
        "slot_label": record.get("slot_label", ""),
        "equip_slot_category": record.get("equip_slot_category", 0),
        "model_main": record.get("model_main") or {},
        "dye_count": record.get("dye_count", 0),
        "dye_display_by_locale": {},
        "dye_display": "",
        "dye_entries": [],
        "is_emperor": record.get("is_emperor", False),
    }


def search_records(records: List[Dict[str, Any]], query: str, locale: str, limit: int) -> List[Dict[str, Any]]:
    matched = [record for record in records if record_matches_query(record, query, locale)]
    matched.sort(key=lambda record: (search_score(record, query, locale), localized_name(record, locale), int(record.get("key", 0))))
    return [serialize_search_record(record, locale) for record in matched[:limit]]


@app.get("/api/stains")
def stains():
    locale = request.args.get("locale", "zh").strip() or "zh"
    query = request.args.get("q", "").strip().casefold()
    mapping = get_mapping()
    stains_by_locale = mapping.get("stains_by_locale") or {}
    fallback_stains = stains_by_locale.get("zh", {})
    locale_stains = stains_by_locale.get(locale) or fallback_stains
    colors = mapping.get("stain_colors") or {}
    group_labels = mapping.get("stain_groups") or {}
    allow_en_fallback = should_search_english_fallback(query, locale)

    results = []
    for key, color in sorted(
        colors.items(),
        key=lambda item: (
            int(item[1].get("group", 0) or 0),
            int(item[1].get("sub_order", 0) or 0),
            int(item[0]),
        ),
    ):
        name = locale_stains.get(key) or fallback_stains.get(key)
        if not name:
            continue
        group = int(color.get("group", 0) or 0)
        group_name = group_labels.get(str(group), f"分组 {group}" if group else "")
        # Only search current locale name + English fallback — not all languages
        searchable_parts = [key, color.get("hex", ""), group, group_name, str(name).casefold()]
        en_stains = stains_by_locale.get("en", {})
        if allow_en_fallback and en_stains.get(key) and en_stains.get(key) != name:
            searchable_parts.append(str(en_stains.get(key)).casefold())
        searchable = " ".join(str(part).casefold() for part in searchable_parts)
        if query and query not in searchable:
            continue
        results.append(
            {
                "id": int(key),
                "name": name,
                "names": {
                    stain_locale: stain_map.get(key)
                    for stain_locale, stain_map in stains_by_locale.items()
                    if isinstance(stain_map, dict) and stain_map.get(key)
                },
                "hex": color.get("hex", "#000000"),
                "rgb": color.get("rgb", 0),
                "group": group,
                "group_name": group_name,
                "sub_order": int(color.get("sub_order", 0) or 0),
            }
        )

    return jsonify({"locale": locale, "results": results})


@app.get("/api/search-items")
def search_items():
    slot = request.args.get("slot", "").strip()
    query = request.args.get("q", "").strip().casefold()
    locale = request.args.get("locale", "zh").strip() or "zh"
    try:
        limit = max(1, min(int(request.args.get("limit", "30")), 80))
    except ValueError:
        limit = 30

    if not query:
        return jsonify({"slot": slot, "results": []})

    mapping = get_mapping()
    if slot == "Glasses":
        records = list((mapping.get("glasses") or {}).values())
        return jsonify({"slot": slot, "results": search_records(records, query, locale, limit)})

    if slot == "FashionAccessory":
        records = list((mapping.get("ornaments") or {}).values())
        return jsonify({"slot": slot, "results": search_records(records, query, locale, limit)})

    slot_label = SEARCH_SLOT_LABELS.get(slot)
    if not slot_label:
        return jsonify({"slot": slot, "results": []})

    records = [
        item
        for item in mapping.get("items", [])
        if item_matches_equipment_slot(item, slot)
    ]
    return jsonify({"slot": slot, "results": search_records(records, query, locale, limit)})


@app.post("/api/parse-chara")
def parse_chara():
    error = require_chara_import_access()
    if error:
        return error

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "missing file"}), 400

    filename = file.filename or ""
    if not filename.lower().endswith(".chara"):
        return jsonify({"error": "invalid file type"}), 400

    data = file.stream.read(app.config["MAX_CONTENT_LENGTH"] + 1)
    if len(data) > app.config["MAX_CONTENT_LENGTH"]:
        return jsonify({"error": "file too large"}), 413

    try:
        chara = json.loads(data.decode("utf-8-sig"))
    except Exception as exc:
        return jsonify({"error": f"failed to parse file: {exc}"}), 400

    return jsonify(resolve_chara_payload(chara, filename))


def can_bind(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def find_open_port() -> int:
    preferred = int(os.environ.get("NSGLAMOUR_PORT", "8765"))
    if can_bind(preferred):
        return preferred

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def open_browser(url: str) -> None:
    webbrowser.open(url, new=1)


def main() -> int:
    port = find_open_port()
    url = f"http://127.0.0.1:{port}"
    if os.environ.get("NSGLAMOUR_NO_BROWSER", "").lower() not in {"1", "true", "yes"}:
        threading.Timer(0.8, open_browser, args=(url,)).start()
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
