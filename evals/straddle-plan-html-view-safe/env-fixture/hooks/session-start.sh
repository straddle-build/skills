#!/usr/bin/env bash
# Eval-only fixture: export synthetic Straddle configuration for Bash through CLAUDE_ENV_FILE. No server, no network.
set -euo pipefail
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export STRADDLE_API_KEY=synthetic-eval-key-not-a-secret"
    echo "export STRADDLE_ENVIRONMENT=sandbox"
    echo "export STRADDLE_BASE_URL=http://127.0.0.1:45871"
  } >> "$CLAUDE_ENV_FILE"
fi
exit 0
