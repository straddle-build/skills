#!/usr/bin/env bash
# Commits the fixture's base as the session's starting point, snapshots it with the payment review's session-state
# script, applies the session's changes uncommitted, then writes the payment review report the Wizard saved after
# its review: current for this plan and code, with one Critical and one High finding.
# Runs only under `claude plugin eval --scaffold`.
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
session_state="$case_dir/../../skills/straddle-payment-review/scripts/session-state"
ident=(-c user.name=eval -c user.email=eval@example.invalid)
cp -R "$case_dir/fixture/base/." .
plan_hash="$(grep -v -e '^- Plan state:' -e '^- Approval:' straddle-integration-plan.md | { sha256sum 2>/dev/null || shasum -a 256; } | cut -c1-64)"
sed -i.bak "s/PLANHASH/$plan_hash/" straddle-integration-plan.md && rm straddle-integration-plan.md.bak
git init -q
git add -A
git "${ident[@]}" commit -qm "fixture"
head="$(git rev-parse HEAD)"
snapshot="$(GIT_AUTHOR_NAME=eval GIT_AUTHOR_EMAIL=eval@example.invalid GIT_COMMITTER_NAME=eval \
  GIT_COMMITTER_EMAIL=eval@example.invalid "$session_state" snapshot)"
git update-ref refs/straddle-wizard/eval "$snapshot"
mkdir -p .straddle-wizard
printf '{ "head": "%s", "snapshot": "%s", "startedAt": "2026-10-03T09:00:00Z" }\n' "$head" "$snapshot" \
  > .straddle-wizard/session-baseline.json
cp -R "$case_dir/fixture/session/." .
sed -i.bak "s/PLANHASH/$plan_hash/" straddle-test-evidence.md && rm straddle-test-evidence.md.bak
code_hash="$("$session_state" compare "$snapshot" | sed -n '1s/^code-hash //p')"
[ ${#code_hash} -eq 64 ] || { echo "scaffold: no code-hash from session-state compare" >&2; exit 1; }
cat > straddle-payment-review.md <<EOF
# Straddle payment review

This review is advisory. It is not a security audit, and a clean report does not mean the code is safe.

Status: findings
Plan hash: $plan_hash
Code hash: $code_hash

| Severity | File:line | Impact | Fix |
| --- | --- | --- | --- |
| Critical | src/checkout.ts:40 | The tip charge amount comes from the request body, so a signed-in user can charge any amount to the order's paykey. | Charge a tip amount chosen from server-side options, or validate it against server-side limits. |
| High | src/checkout.ts:39 | The tip route never checks that the order belongs to the signed-in user, so any user can charge a tip to another owner's bank account. | Require order.ownerId to equal the signed-in user before charging. |
EOF
