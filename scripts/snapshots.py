"""Persistent, public-safe equipment snapshots for the EquipInfo viewer."""

from __future__ import annotations

import json
import hashlib
import re
import secrets
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping

from flask import Flask, jsonify, request


SNAPSHOT_VERSION = 1
MAX_SNAPSHOT_BYTES = 64 * 1024
SNAPSHOT_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{20,96}$")
HEX_COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")

SUPPORTED_LOCALES = ("ja", "en", "fr", "de", "zh", "tc", "ko")
KNOWN_SLOTS = (
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
)
SLOT_ORDER = {slot: index for index, slot in enumerate(KNOWN_SLOTS)}


class SnapshotValidationError(ValueError):
    """The request did not contain a shareable equipment selection."""


class SnapshotNotFoundError(LookupError):
    """The requested opaque snapshot id does not exist."""


def _as_mapping(value: Any) -> Mapping[str, Any]:
    return value if isinstance(value, Mapping) else {}


def _text(value: Any, limit: int = 256) -> str:
    return str(value or "").strip()[:limit]


def _localized_map(value: Any, limit: int = 256) -> Dict[str, str]:
    source = _as_mapping(value)
    return {
        locale: _text(source.get(locale), limit)
        for locale in SUPPORTED_LOCALES
        if _text(source.get(locale), limit)
    }


def _integer(value: Any, minimum: int = 0, maximum: int = 9_999_999) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return minimum
    return min(max(number, minimum), maximum)


def _sanitize_dyes(value: Any) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    source = value if isinstance(value, list) else []

    for raw_dye in source[:2]:
        dye = _as_mapping(raw_dye)
        stain_id = _integer(dye.get("id"))
        hex_color = _text(dye.get("hex"), 16)
        result.append(
            {
                "id": stain_id,
                "name": _text(dye.get("name")),
                "names": _localized_map(dye.get("names")),
                "hex": hex_color if HEX_COLOR_PATTERN.fullmatch(hex_color) else "transparent",
                "isEmpty": bool(dye.get("isEmpty")) or stain_id == 0,
            }
        )

    return result


def sanitize_snapshot_payload(value: Any) -> Dict[str, Any]:
    """Project a browser draft to the only data the public viewer may receive."""

    raw = _as_mapping(value)
    raw_entries = raw.get("entries")
    if not isinstance(raw_entries, list):
        raise SnapshotValidationError("snapshot entries are required")

    slot_names = _as_mapping(raw.get("slot_names"))
    safe_entries: List[Dict[str, Any]] = []
    seen_slots: set[str] = set()

    for raw_entry in raw_entries:
        entry = _as_mapping(raw_entry)
        slot = _text(entry.get("slot"), 64)
        candidate = _as_mapping(entry.get("candidate"))

        if slot not in KNOWN_SLOTS or slot in seen_slots:
            continue

        names = _localized_map(candidate.get("names"))
        name = _text(candidate.get("name"))
        if not names and not name:
            continue

        seen_slots.add(slot)
        safe_entries.append(
            {
                "slot": slot,
                "slot_names": _localized_map(entry.get("slot_names") or slot_names.get(slot)),
                "item": {
                    "key": _text(candidate.get("key"), 96),
                    "name": name,
                    "names": names,
                    "icon": _integer(candidate.get("icon")),
                    "dyes": _sanitize_dyes(candidate.get("dye_entries")),
                },
            }
        )

    safe_entries.sort(key=lambda entry: SLOT_ORDER[entry["slot"]])
    if not safe_entries:
        raise SnapshotValidationError("snapshot must contain equipment")

    raw_locales = raw.get("locales") if isinstance(raw.get("locales"), list) else []
    available_locales = [
        locale
        for locale in SUPPORTED_LOCALES
        if locale in raw_locales or any(locale in entry["item"]["names"] for entry in safe_entries)
    ]
    if not available_locales:
        available_locales = ["zh"]

    snapshot = {
        "version": SNAPSHOT_VERSION,
        "locales": available_locales,
        "slot_names": {slot: _localized_map(names) for slot, names in slot_names.items() if slot in KNOWN_SLOTS},
        "no_dye_labels": _localized_map(raw.get("no_dye_labels")),
        "entries": safe_entries,
    }
    encoded = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(encoded) > MAX_SNAPSHOT_BYTES:
        raise SnapshotValidationError("snapshot is too large")
    return snapshot


def _encode_snapshot_payload(payload: Mapping[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def _snapshot_content_hash(payload_json: str) -> str:
    return hashlib.sha256(payload_json.encode("utf-8")).hexdigest()


class EquipmentSnapshotStore:
    """Small SQLite repository whose rows deliberately contain no draft metadata."""

    def __init__(self, path: Path):
        self.path = Path(path)

    def _connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def _ensure_schema(self, connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS equipment_snapshots (
                snapshot_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                content_hash TEXT
            )
            """
        )
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(equipment_snapshots)").fetchall()
        }
        if "content_hash" not in columns:
            connection.execute("ALTER TABLE equipment_snapshots ADD COLUMN content_hash TEXT")

        existing_hashes = {
            row["content_hash"]
            for row in connection.execute(
                "SELECT content_hash FROM equipment_snapshots WHERE content_hash IS NOT NULL"
            ).fetchall()
        }
        legacy_rows = connection.execute(
            """
            SELECT snapshot_id, payload_json
            FROM equipment_snapshots
            WHERE content_hash IS NULL
            ORDER BY created_at, snapshot_id
            """
        ).fetchall()
        for row in legacy_rows:
            try:
                payload = json.loads(row["payload_json"])
                payload_json = _encode_snapshot_payload(payload)
            except (TypeError, json.JSONDecodeError):
                continue
            content_hash = _snapshot_content_hash(payload_json)
            if content_hash in existing_hashes:
                continue
            connection.execute(
                "UPDATE equipment_snapshots SET payload_json = ?, content_hash = ? WHERE snapshot_id = ?",
                (payload_json, content_hash, row["snapshot_id"]),
            )
            existing_hashes.add(content_hash)

        connection.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS equipment_snapshots_content_hash_unique
            ON equipment_snapshots(content_hash)
            WHERE content_hash IS NOT NULL
            """
        )
        connection.commit()

    @staticmethod
    def _response_from_row(row: sqlite3.Row, *, reused: bool) -> Dict[str, Any]:
        try:
            payload = json.loads(row["payload_json"])
        except (TypeError, json.JSONDecodeError) as error:
            raise SnapshotNotFoundError(row["snapshot_id"]) from error
        return {
            "id": row["snapshot_id"],
            "created_at": row["created_at"],
            "snapshot": payload,
            "reused": reused,
        }

    def create(self, raw_payload: Any) -> Dict[str, Any]:
        payload = sanitize_snapshot_payload(raw_payload)
        payload_json = _encode_snapshot_payload(payload)
        content_hash = _snapshot_content_hash(payload_json)
        created_at = datetime.now(timezone.utc).isoformat()

        with closing(self._connect()) as connection:
            self._ensure_schema(connection)
            existing = connection.execute(
                """
                SELECT snapshot_id, created_at, payload_json
                FROM equipment_snapshots
                WHERE content_hash = ?
                """,
                (content_hash,),
            ).fetchone()
            if existing is not None:
                return self._response_from_row(existing, reused=True)

            for _ in range(4):
                snapshot_id = secrets.token_urlsafe(18)
                try:
                    connection.execute(
                        """
                        INSERT INTO equipment_snapshots
                            (snapshot_id, created_at, payload_json, content_hash)
                        VALUES (?, ?, ?, ?)
                        """,
                        (snapshot_id, created_at, payload_json, content_hash),
                    )
                    connection.commit()
                    return {
                        "id": snapshot_id,
                        "created_at": created_at,
                        "snapshot": payload,
                        "reused": False,
                    }
                except sqlite3.IntegrityError:
                    existing = connection.execute(
                        """
                        SELECT snapshot_id, created_at, payload_json
                        FROM equipment_snapshots
                        WHERE content_hash = ?
                        """,
                        (content_hash,),
                    ).fetchone()
                    if existing is not None:
                        return self._response_from_row(existing, reused=True)

        raise RuntimeError("could not allocate snapshot id")

    def get(self, snapshot_id: str) -> Dict[str, Any]:
        normalized_id = _text(snapshot_id, 96)
        if not SNAPSHOT_ID_PATTERN.fullmatch(normalized_id):
            raise SnapshotNotFoundError(normalized_id)

        with closing(self._connect()) as connection:
            self._ensure_schema(connection)
            row = connection.execute(
                "SELECT snapshot_id, created_at, payload_json FROM equipment_snapshots WHERE snapshot_id = ?",
                (normalized_id,),
            ).fetchone()

        if row is None:
            raise SnapshotNotFoundError(normalized_id)

        return self._response_from_row(row, reused=False)


def register_snapshot_routes(app: Flask, store: EquipmentSnapshotStore) -> None:
    """Register only the public read/create endpoints; callers own service setup."""

    @app.post("/api/equipinfo/snapshots")
    def create_equipment_snapshot():
        payload = request.get_json(silent=True)
        if not isinstance(payload, Mapping):
            return jsonify({"error": "invalid snapshot"}), 400
        try:
            result = store.create(payload)
            return jsonify(result), 200 if result["reused"] else 201
        except SnapshotValidationError:
            return jsonify({"error": "invalid snapshot"}), 400

    @app.get("/api/equipinfo/snapshots/<snapshot_id>")
    def get_equipment_snapshot(snapshot_id: str):
        try:
            return jsonify(store.get(snapshot_id))
        except SnapshotNotFoundError:
            return jsonify({"error": "snapshot not found"}), 404
