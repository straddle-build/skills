#!/usr/bin/env bash
# The clean Brewbox app in straddle-audit-paid-then-reversed/fixture, its approved plan, and one seeded lifecycle gap
# (ME-903):
# the plan covers a cancelled charge, and src/lifecycle.ts has no handler for it. Runs only under `claude plugin eval --scaffold`.
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -R "$case_dir/../straddle-audit-paid-then-reversed/fixture/." .
python3 - <<'PY'
import pathlib


def seed(path, old, new):
    p = pathlib.Path(path)
    text = p.read_text()
    assert text.count(old) == 1, (path, old)
    p.write_text(text.replace(old, new))

seed('src/lifecycle.ts', '''    case 'cancelled':
      await db.orders.setState(order.id, 'cancelled');
      break;
''', '''''')
PY
cat > straddle-integration-plan.md <<'PLAN'
# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-10-02, "Approved.", recorded by straddle-plan, sha256 c3891391a877cc5ed17333f58675661edc29e875fac3d2fb2728aef66dfc187e
- Last reviewed: 2026-10-02
- Repository and branch: brewbox, main
- Straddle skills version: 0.1.2
- API contract version: 1.0.4
- SDK package and exact installed version: @straddlecom/straddle 1.0.4

## Goal

Charge Brewbox's monthly coffee boxes by bank. One business, one Straddle account (direct integration), Pay by Bank charges only.

## Decisions

| # | Decision | Answer | Source | Why |
| --- | --- | --- | --- | --- |
| Q1 | Integration type | direct (`account`) | developer | Brewbox collects for itself. |
| Q2 | Products | Pay by Bank charges only | developer | Subscribers pay; nothing is paid out. |
| Q3 | Bank connection | Bridge widget | developer | |
| Q4 | Notification path | webhook endpoint | developer | |
| Q5 | App behavior per status | ship on `paid`; on `reversed` after `paid`, hold future boxes and record the clawback; show `failed` with its reason; `on_hold` shows "under review"; a `cancelled` charge cancels the order and frees its box | developer | `paid` isn't final for ACH. |
| Q6 | Refunds and resubmits | one refund per paid charge; resubmit `insufficient_funds` once | developer, accepted recommendation | |
| Q7 | Reconciliation | settle payments from funding events, matched by funding event `id` | developer, accepted recommendation | |

## Lifecycle handling

| Resource | Status or event | What the app does | Decision | Reference |
| --- | --- | --- | --- | --- |
| Paykey | `pending`, `active`, `review`, `rejected`, `blocked`, `inactive` | store the status; charge only an `active` paykey | Q3 | `bridge-and-paykeys.md` |
| Charge | `created`, `scheduled`, `pending` | order shows "processing" | Q5 | `charges.md` |
| Charge | `paid` | ship the box | Q5 | `charges.md` |
| Charge | `failed`, and `reversed` after `paid` | show the reason; on `reversed`, hold future boxes and record the clawback | Q5 | `returns-and-disputes.md` |
| Charge | `on_hold`, `cancelled` | "under review"; a cancelled charge cancels the order and frees its box | Q5 | `charges.md` |
| Refund and resubmit | `refundCharge` payout, `resubmitCharge` | one refund per paid charge; resubmit `insufficient_funds` once | Q6 | `refunds-and-resubmits.md` |
| Funding event | `charge_deposit`, `charge_reversal` | settle each payment from its funding event | Q7 | `funding-and-reconciliation.md` |

## File changes

| File | Existing or new | Change | Behavior proved | Test |
| --- | --- | --- | --- | --- |
| src/straddle.ts | new | client with explicit key and environment | configuration error | test/straddle.test.ts |
| src/checkout.ts | new | charge an active paykey with external ID and idempotency key | key and external ID | test/straddle.test.ts |
| src/webhooks.ts | new | verified webhook endpoint, stored once before `2xx` | signature, duplicate | test/straddle.test.ts |
| src/lifecycle.ts | new | the Lifecycle handling rows above | one test per status | test/straddle.test.ts |
| src/refunds.ts | new | guarded refund and resubmit | one refund, one resubmit | test/straddle.test.ts |
| src/reconcile.ts | new | funding event reconciliation | netting | test/straddle.test.ts |

## Unresolved decisions

- None.
PLAN
# The installed SDK is fixture data for triage, not something the app commits.
printf 'node_modules/\n' > .gitignore
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "fixture"
