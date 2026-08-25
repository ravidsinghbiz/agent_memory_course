#!/usr/bin/env bash
# Launch the Agent Memory Benchmarks app.
#   Activates the `oracle_demos` conda env (oracleagentmemory, anthropic, litellm,
#   fastembed, oracledb, fastapi, uvicorn, sse-starlette all live there).
set -euo pipefail

cd "$(dirname "$0")"

PYTHON_BIN="${PYTHON_BIN:-$(command -v python)}"
if command -v conda >/dev/null 2>&1; then
  ORACLE_DEMOS_PREFIX="$(conda env list 2>/dev/null | awk '$1 == "oracle_demos" {print $NF; exit}')"
  if [[ -n "${ORACLE_DEMOS_PREFIX}" && -x "${ORACLE_DEMOS_PREFIX}/bin/python" ]]; then
    # Use the interpreter by absolute path. This remains correct even when the
    # caller already has another virtualenv activated ahead of Conda on PATH.
    PYTHON_BIN="${ORACLE_DEMOS_PREFIX}/bin/python"
  fi
fi

# Install the web stack only if it's missing (it ships with oracle_demos here).
"${PYTHON_BIN}" -c "import fastapi, uvicorn, sse_starlette, dotenv" 2>/dev/null \
  || "${PYTHON_BIN}" -m pip install -q "fastapi>=0.110" "uvicorn[standard]" sse-starlette python-dotenv

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8004}"
echo "→ Agent Memory Benchmarks on http://${HOST}:${PORT}"
exec "${PYTHON_BIN}" -m uvicorn backend.main:app --host "${HOST}" --port "${PORT}" "$@"
