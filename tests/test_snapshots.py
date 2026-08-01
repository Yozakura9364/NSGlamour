import json
import sqlite3
import sys
import tempfile
import unittest
import re
from contextlib import closing
from pathlib import Path

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from snapshots import (
    EquipmentSnapshotStore,
    SnapshotNotFoundError,
    register_snapshot_routes,
    sanitize_snapshot_payload,
)


def sample_payload():
    return {
        "locales": ["zh", "en"],
        "slot_names": {"Body": {"zh": "身体", "en": "Body"}},
        "no_dye_labels": {"zh": "无染色", "en": "No Dye"},
        "entries": [
            {
                "slot": "Body",
                "candidate": {
                    "key": "123",
                    "name": "测试装备",
                    "names": {"zh": "测试装备", "en": "Test Equipment"},
                    "icon": 12345,
                    "dye_entries": [],
                },
            }
        ],
    }


class EquipmentSnapshotTests(unittest.TestCase):
    def test_identical_public_payload_reuses_id(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EquipmentSnapshotStore(Path(directory) / "snapshots.sqlite3")
            first = store.create(sample_payload())
            second_payload = sample_payload()
            second_payload["source"] = {"url": "https://ignored.example"}
            second = store.create(second_payload)

        self.assertEqual(second["id"], first["id"])
        self.assertRegex(first["id"], re.compile(r"^[A-Za-z0-9]{10}$"))
        self.assertFalse(first["reused"])
        self.assertTrue(second["reused"])

    def test_route_returns_201_then_200(self):
        with tempfile.TemporaryDirectory() as directory:
            app = Flask(__name__)
            register_snapshot_routes(app, EquipmentSnapshotStore(Path(directory) / "snapshots.sqlite3"))
            client = app.test_client()
            first = client.post("/api/equipinfo/snapshots", json=sample_payload())
            second = client.post("/api/equipinfo/snapshots", json=sample_payload())

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.get_json()["id"], second.get_json()["id"])

    def test_legacy_database_removes_existing_long_id(self):
        with tempfile.TemporaryDirectory() as directory:
            database_path = Path(directory) / "snapshots.sqlite3"
            payload = sanitize_snapshot_payload(sample_payload())
            with closing(sqlite3.connect(database_path)) as connection:
                connection.execute(
                    """
                    CREATE TABLE equipment_snapshots (
                        snapshot_id TEXT PRIMARY KEY,
                        created_at TEXT NOT NULL,
                        payload_json TEXT NOT NULL
                    )
                    """
                )
                connection.execute(
                    "INSERT INTO equipment_snapshots VALUES (?, ?, ?)",
                    (
                        "legacy_snapshot_identifier",
                        "2026-01-01T00:00:00+00:00",
                        json.dumps(payload, ensure_ascii=False),
                    ),
                )
                connection.commit()

            created = EquipmentSnapshotStore(database_path).create(sample_payload())
            with self.assertRaises(SnapshotNotFoundError):
                EquipmentSnapshotStore(database_path).get("legacy_snapshot_identifier")

        self.assertRegex(created["id"], re.compile(r"^[A-Za-z0-9]{10}$"))
        self.assertFalse(created["reused"])


if __name__ == "__main__":
    unittest.main()
