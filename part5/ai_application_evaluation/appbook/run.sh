#!/usr/bin/env bash
# Launch the AI Application Evaluation app.
#   • Locally: activates the `oracle_demos` conda env (has all deps).
#   • In a Codespace / dev container: uses the system Python (deps already installed).
set -euo pipefail

cd "$(dirname "$0")"

# Resolve the environment's interpreter directly. Merely activating Conda is
# not sufficient when the caller already has another virtualenv first on PATH.
PYTHON_BIN="${PYTHON_BIN:-$(command -v python)}"
if command -v conda >/dev/null 2>&1; then
  ORACLE_DEMOS_PREFIX="$(conda env list 2>/dev/null | awk '$1 == "oracle_demos" {print $NF; exit}')"
  if [[ -n "${ORACLE_DEMOS_PREFIX}" && -x "${ORACLE_DEMOS_PREFIX}/bin/python" ]]; then
    PYTHON_BIN="${ORACLE_DEMOS_PREFIX}/bin/python"
  fi
fi

"${PYTHON_BIN}" -c "import fastapi" 2>/dev/null || "${PYTHON_BIN}" -m pip install -q "fastapi>=0.110"

HOST="${HOST:-127.0.0.1}"   # devcontainer sets HOST=0.0.0.0 for port forwarding
PORT="${PORT:-8003}"        # 8001 = maturity ladder, 8002 = agent memory, 8003 = evaluation
echo "→ AI Application Evaluation on http://${HOST}:${PORT}"
exec "${PYTHON_BIN}" -m uvicorn backend.main:app --host "${HOST}" --port "${PORT}" "$@"
