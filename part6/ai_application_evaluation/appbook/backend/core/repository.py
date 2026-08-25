from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.config import settings


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class EvaluationRepository:
    TABLES = ("evaluation_runs", "evaluation_results", "release_gates")

    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._initialize()

    def connect(self):
        connection = sqlite3.connect(self.path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _initialize(self):
        with self.connect() as connection:
            connection.executescript("""
                CREATE TABLE IF NOT EXISTS evaluation_runs (
                    run_id TEXT PRIMARY KEY,
                    form_factor TEXT NOT NULL,
                    status TEXT NOT NULL,
                    passed INTEGER,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    metrics_json TEXT
                );
                CREATE TABLE IF NOT EXISTS evaluation_results (
                    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL,
                    case_id TEXT NOT NULL,
                    label TEXT NOT NULL,
                    scores_json TEXT NOT NULL,
                    evidence_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(run_id) REFERENCES evaluation_runs(run_id)
                );
                CREATE TABLE IF NOT EXISTS release_gates (
                    gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL,
                    metric TEXT NOT NULL,
                    value REAL NOT NULL,
                    target REAL NOT NULL,
                    direction TEXT NOT NULL,
                    passed INTEGER NOT NULL,
                    FOREIGN KEY(run_id) REFERENCES evaluation_runs(run_id)
                );
                CREATE INDEX IF NOT EXISTS ix_eval_results_run ON evaluation_results(run_id);
                CREATE INDEX IF NOT EXISTS ix_release_gates_run ON release_gates(run_id);
            """)

    def start_run(self, form_factor: str) -> str:
        run_id = str(uuid.uuid4())
        with self._lock, self.connect() as connection:
            connection.execute(
                "INSERT INTO evaluation_runs(run_id,form_factor,status,started_at) VALUES(?,?,?,?)",
                (run_id, form_factor, "running", utcnow()),
            )
        return run_id

    def add_result(self, run_id: str, row: dict[str, Any]):
        with self._lock, self.connect() as connection:
            connection.execute(
                "INSERT INTO evaluation_results(run_id,case_id,label,scores_json,evidence_json,created_at) VALUES(?,?,?,?,?,?)",
                (run_id,row["case_id"],row["label"],json.dumps(row["scores"],sort_keys=True),
                 json.dumps(row["evidence"],sort_keys=True),utcnow()),
            )

    def complete_run(self, run_id: str, summary: dict[str, float], gates: dict[str, Any], passed: bool):
        with self._lock, self.connect() as connection:
            connection.execute(
                "UPDATE evaluation_runs SET status='complete',passed=?,completed_at=?,metrics_json=? WHERE run_id=?",
                (int(passed),utcnow(),json.dumps(summary,sort_keys=True),run_id),
            )
            connection.executemany(
                "INSERT INTO release_gates(run_id,metric,value,target,direction,passed) VALUES(?,?,?,?,?,?)",
                [(run_id,key,item["value"],item["target"],item["direction"],int(item["passed"]))
                 for key,item in gates.items()],
            )

    def counts(self) -> dict[str, int]:
        with self.connect() as connection:
            return {table:int(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])
                    for table in self.TABLES}

    def tables(self) -> list[dict[str, Any]]:
        counts = self.counts()
        descriptions = {
            "evaluation_runs":"One immutable summary row per suite execution.",
            "evaluation_results":"Per-case scores and raw evaluator evidence.",
            "release_gates":"Every threshold decision, including failures.",
        }
        with self.connect() as connection:
            output = []
            for table in self.TABLES:
                columns = [dict(row) for row in connection.execute(f"PRAGMA table_info({table})")]
                output.append({"name":table,"rows":counts[table],"description":descriptions[table],
                               "columns":[{"name":c["name"],"type":c["type"],"primary_key":bool(c["pk"])} for c in columns]})
            return output

    def rows(self, table: str, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        if table not in self.TABLES:
            raise KeyError(table)
        safe_limit = min(max(int(limit),1),200)
        safe_offset = max(int(offset),0)
        with self.connect() as connection:
            total = int(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])
            rows = [dict(row) for row in connection.execute(
                f"SELECT * FROM {table} ORDER BY rowid DESC LIMIT ? OFFSET ?",(safe_limit,safe_offset))]
        return {"table":table,"rows":rows,"total":total,"limit":safe_limit,"offset":safe_offset}

    def recent(self, limit: int = 12) -> list[dict[str, Any]]:
        with self.connect() as connection:
            return [dict(row) for row in connection.execute(
                "SELECT run_id,form_factor,status,passed,started_at,completed_at FROM evaluation_runs "
                "ORDER BY started_at DESC LIMIT ?",(min(max(limit,1),50),))]


repository = EvaluationRepository(settings.database_path)
