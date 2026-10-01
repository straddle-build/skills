#!/usr/bin/env bash
# The status-polling-refusal repository, with an approved plan that also covers the dispute and R29 block.
set -euo pipefail
bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../straddle-test-status-polling-refusal/scaffold.sh"
cat >> straddle-integration-plan.md <<'MD'
- Sandbox: dispute and R29 block, a charge with failed_not_authorized for seller A (failed with R29, paykey blocked), then the one-time unblock
MD
hash=$(grep -v -e '^- Plan state:' -e '^- Approval:' straddle-integration-plan.md | { sha256sum 2>/dev/null || shasum -a 256; } | cut -c1-64)
awk -v h="$hash" '/^- Approval:/ { sub(/sha256 [0-9a-f]+/, "sha256 " h) } { print }' straddle-integration-plan.md > straddle-integration-plan.md.tmp
mv straddle-integration-plan.md.tmp straddle-integration-plan.md
