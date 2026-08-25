from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


APP_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = APP_DIR / "frontend"
DATA_DIR = APP_DIR / ".data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

for candidate in (APP_DIR.parent.parent / ".env", APP_DIR.parent / ".env", APP_DIR / ".env"):
    if candidate.exists():
        load_dotenv(candidate, override=True)


class Settings:
    database_path = Path(
        os.environ.get("AIEVAL_DATABASE_PATH", DATA_DIR / "evaluation_runs.sqlite3")
    ).expanduser().resolve()
    suite_delay_ms = max(0, int(os.environ.get("AIEVAL_SUITE_DELAY_MS", "70")))
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8006"))


settings = Settings()
