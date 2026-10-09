#!/usr/bin/env bash
# The straddle-integrate-sdk-install-keeps-lockfile repository before anyone ran npm install: no package-lock.json
# and no node_modules, so the SDK install the plan names creates the lockfile (ME-918).
set -euo pipefail
bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../straddle-integrate-sdk-install-keeps-lockfile/scaffold.sh"
git rm -q package-lock.json
rm -rf node_modules
git -c user.name=eval -c user.email=eval@example.invalid commit -q -m "no lockfile yet"
