#!/usr/bin/env bash
# Commits the fixture's base as the session's starting point, applies any edits made before the session,
# snapshots that start state with the skill's session-state script, then applies the session's changes uncommitted.
# Last, it writes the review scope the Straddle Wizard writes before it launches the reviewer, at the directory the
# prompt names: changes.txt is the compare output, plan-hash.txt the plan's approval hash, and start/<path> the start
# bytes of each modified or deleted file.
# Runs only under `claude plugin eval --scaffold`.
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$case_dir/fixture/base" ]; then
  echo "scaffold: fixture/base not found at $case_dir/fixture/base" >&2
  exit 1
fi
session_state="$case_dir/../../skills/straddle-payment-review/scripts/session-state"
ident=(-c user.name=eval -c user.email=eval@example.invalid)
cp -R "$case_dir/fixture/base/." .
git init -q
git add -A
git "${ident[@]}" commit -qm "fixture"
if [ -d "$case_dir/fixture/before-session" ]; then cp -R "$case_dir/fixture/before-session/." .; fi
head="$(git rev-parse HEAD)"
snapshot="$(GIT_AUTHOR_NAME=eval GIT_AUTHOR_EMAIL=eval@example.invalid GIT_COMMITTER_NAME=eval \
  GIT_COMMITTER_EMAIL=eval@example.invalid "$session_state" snapshot)"
git update-ref refs/straddle-wizard/eval "$snapshot"
mkdir -p .straddle-wizard
printf '{ "head": "%s", "snapshot": "%s", "startedAt": "2026-10-03T09:00:00Z" }\n' "$head" "$snapshot" \
  > .straddle-wizard/session-baseline.json
cp -R "$case_dir/fixture/session/." .
scope=.straddle-wizard/runs/eval/review-scope
rm -rf "$scope"
mkdir -p "$scope/start"
"$session_state" compare "$snapshot" > "$scope/changes.txt"
head -n 1 "$scope/changes.txt" | grep -Eq '^code-hash [0-9a-f]{64}$' || { echo "scaffold: compare printed no code hash" >&2; exit 1; }
grep -v -e '^- Plan state:' -e '^- Approval:' straddle-integration-plan.md | { sha256sum 2>/dev/null || shasum -a 256; } \
  | cut -c1-64 > "$scope/plan-hash.txt"
sed -nE 's/^(modified|deleted) //p' "$scope/changes.txt" | while IFS= read -r path; do
  mkdir -p "$scope/start/$(dirname "$path")"
  git --no-pager -c core.fsmonitor=false -c core.hooksPath=/dev/null cat-file blob "$snapshot:$path" > "$scope/start/$path"
done
