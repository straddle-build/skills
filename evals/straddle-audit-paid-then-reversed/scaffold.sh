#!/usr/bin/env bash
# The clean Brewbox app in straddle-audit-paid-then-reversed/fixture with one seeded Product model defect (ME-903):
# P1, no handler for a charge reversed after paid. Runs only under `claude plugin eval --scaffold`.
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

seed('src/lifecycle.ts', '''    case 'reversed':
      // A return after paid (R01, R02, or a dispute weeks later): undo what paid released.
      await db.orders.setState(order.id, 'returned after paid', charge.status_details);
      await db.shipments.holdFutureBoxes(order.id);
      await db.ledger.recordClawback(order.id, charge.amount, charge.status_details?.code);
      break;
''', '''''')
PY
# The installed SDK is fixture data for triage, not something the app commits.
printf 'node_modules/\n' > .gitignore
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "fixture"
