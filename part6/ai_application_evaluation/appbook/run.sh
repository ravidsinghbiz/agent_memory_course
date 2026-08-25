#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if command -v conda >/dev/null 2>&1 && conda env list 2>/dev/null | grep -q '/oracle_demos$\|oracle_demos '; then
  # shellcheck disable=SC1091
  source "$(conda info --base)/etc/profile.d/conda.sh"
  conda activate oracle_demos
fi

python -c "import fastapi, sse_starlette" 2>/dev/null || python -m pip install -q -r requirements.txt
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8006}"
echo "→ AI Application Evaluation Studio on http://${HOST}:${PORT}"
exec uvicorn backend.main:app --host "${HOST}" --port "${PORT}" "$@"
