#!/usr/bin/env bash
# The clean Brewbox app in straddle-audit-paid-then-reversed/fixture with one seeded Product model defect (ME-903):
# P4, payments marked settled at paid with no funding-event reconciliation. Runs only under `claude plugin eval --scaffold`.
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

seed('src/lifecycle.ts', '''import { reconcileFundingEvent } from './reconcile';
''', '''''')
seed('src/lifecycle.ts', '''    case 'funding_event.event.v1':
      return reconcileFundingEvent(event.data);
''', '''''')
seed('src/lifecycle.ts', '''      await db.shipments.release(order.id);
''', '''      await db.shipments.release(order.id);
      await db.ledger.markSettled(order.id, charge.amount);
''')
PY
rm src/reconcile.ts
# The installed SDK is fixture data for triage, not something the app commits.
printf 'node_modules/\n' > .gitignore
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "fixture"
