#!/usr/bin/env bash
# The clean Brewbox app in straddle-audit-paid-then-reversed/fixture with one seeded Product model defect (ME-903):
# P3, a refund and a resubmit with no guard. Runs only under `claude plugin eval --scaffold`.
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

seed('src/refunds.ts', '''// One refund per paid charge, with its own idempotency key.
export async function refundOrder(orderId: string) {
  const order = await db.orders.get(orderId);
  if (order.refundId) return order.refundId;
  if (order.chargeStatus !== 'paid') throw new Error(`order ${orderId} isn't paid; only a paid charge is refunded`);
''', '''export async function refundOrder(orderId: string) {
  const order = await db.orders.get(orderId);
''')
seed('src/refunds.ts', '''// Resubmit once, and only an insufficient_funds return (R01 or R09).
export async function resubmitOrder(orderId: string) {
  const order = await db.orders.get(orderId);
  if (order.resubmitChargeId) return order.resubmitChargeId;
  if (!['failed', 'reversed'].includes(order.chargeStatus) || order.returnReason !== 'insufficient_funds') {
    throw new Error(`order ${orderId} can't be resubmitted: ${order.chargeStatus}, ${order.returnReason}`);
  }
''', '''export async function resubmitOrder(orderId: string) {
  const order = await db.orders.get(orderId);
''')
PY
# The installed SDK is fixture data for triage, not something the app commits.
printf 'node_modules/\n' > .gitignore
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "fixture"
