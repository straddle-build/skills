#!/usr/bin/env bash
# Copies this case's fixture repository into the empty eval workspace and commits it,
# so the skill sees a real git working tree. Runs only under `claude plugin eval --scaffold`.
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$case_dir/fixture" ]; then
  echo "scaffold: fixture directory not found at $case_dir/fixture" >&2
  exit 1
fi
cp -R "$case_dir/fixture/." .
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "fixture"
