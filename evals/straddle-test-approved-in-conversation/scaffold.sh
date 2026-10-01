#!/usr/bin/env bash
# The plan-edited-after-approval repository: the plan changed after its recorded approval, so the developer must approve it again.
set -euo pipefail
bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../straddle-test-plan-edited-after-approval/scaffold.sh"
