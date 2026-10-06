#!/usr/bin/env bash
# Commits the fixture's base as the session's starting point, applies any edits made before the session,
# snapshots that start state with the skill's session-state script, then applies the session's changes uncommitted.
# Runs only under `claude plugin eval --scaffold`.
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$case_dir/fixture/base" ]; then
  echo "scaffold: fixture/base not found at $case_dir/fixture/base" >&2
  exit 1
fi
ident=(-c user.name=eval -c user.email=eval@example.invalid)
cp -R "$case_dir/fixture/base/." .
git init -q
git add -A
git "${ident[@]}" commit -qm "fixture"
if [ -d "$case_dir/fixture/before-session" ]; then cp -R "$case_dir/fixture/before-session/." .; fi
head="$(git rev-parse HEAD)"
snapshot="$(GIT_AUTHOR_NAME=eval GIT_AUTHOR_EMAIL=eval@example.invalid GIT_COMMITTER_NAME=eval \
  GIT_COMMITTER_EMAIL=eval@example.invalid "$case_dir/../../skills/straddle-payment-review/scripts/session-state" snapshot)"
git update-ref refs/straddle-wizard/eval "$snapshot"
mkdir -p .straddle-wizard
printf '{ "head": "%s", "snapshot": "%s", "startedAt": "2026-10-03T09:00:00Z" }\n' "$head" "$snapshot" \
  > .straddle-wizard/session-baseline.json
cp -R "$case_dir/fixture/session/." .
