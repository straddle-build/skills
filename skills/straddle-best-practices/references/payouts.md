# Payouts

Every status, field, and operation in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. Facts marked "Observed in Sandbox" come from Sandbox runs, not from the contract or the docs. For details beyond this page, search the Docs MCP by concept, for example "payouts" or "payment statuses".

## What it is

A payout pushes money to a customer's bank account over ACH. It's the mirror of a charge: the same paykey token, `amount` in cents, `currency` `USD`, `payment_date` ([Payment dates](writes-and-approval.md#payment-dates)), `device.ip_address`, `description`, and an `external_id` that must be unique across payouts. A payout has no `consent_type` and no balance check. Its `config` takes `auto_hold`, `auto_hold_message`, and `sandbox_outcome`.

Use `external_id` for your disbursement or withdrawal ID and `metadata` (up to 20 string pairs) for your other IDs. `is_refund` is `true` when the payout refunds a charge ([refunds-and-resubmits.md](refunds-and-resubmits.md)).

Money moves the other way from a charge. Straddle withdraws the payout's funds from your linked bank account before it sends the payout (`payout_withdrawal`), and deposits them back when the payout fails or is returned (`payout_return`). See [funding-and-reconciliation.md](funding-and-reconciliation.md).

## States and transitions

Payouts use the same statuses as charges: `created` → `scheduled` → `pending` → `paid`, with `on_hold`, `cancelled`, `failed`, and `reversed`. The table in [charges.md](charges.md#states-and-transitions) applies, with the payout operations:

- `updatePayout` changes `amount`, `description`, `payment_date`, or `metadata` while the payout is `created` or `on_hold`.
- `holdPayout` needs `created` or `scheduled`. `releasePayout` moves `on_hold` back to `created`. `cancelPayout` needs `created`, `scheduled`, or `on_hold`.
- `resubmitPayout` creates a new payout from a `failed`, `reversed`, or `cancelled` one.
- After `pending`, nothing stops it.

A payout is `failed` or `reversed` when the receiving bank returns it. The common credit returns are R02 (`closed_bank_account`), R03 and R04 (`invalid_bank_account`), and R23 (`payout_refused`: the receiver refused the credit). `status_details` and `status_history` work as they do for charges.

## What your app must handle

- Mark the disbursement sent on `paid`, not on create. Until then it can still fail.
- On `failed` or `reversed`, restore the customer's balance in your app and ask for another bank account when the reason is `closed_bank_account`, `invalid_bank_account`, or `payout_refused`.
- Expect your linked bank account to be debited before the payout is sent. Keep enough funds there, or the payout can't be funded.
- Treat refund payouts as payouts: the same events and statuses, identified by `is_refund` and `related_payments`.
- Offer hold, cancel, and edit only in the windows in [States and transitions](#states-and-transitions).

## Events and Sandbox outcomes

- `payout.created.v1` on create, and `payout.event.v1` on create and on every status change, with the whole payout in `data` ([webhooks.md](webhooks.md)).
- Funding: `payout_withdrawal` before sending and `payout_return` after a failure or return.

**Sandbox gap (ME-896), observed on one Sandbox account on 2026-09-29 and 2026-09-30:** payouts didn't reach `paid`. Payouts created with every payout `sandbox_outcome` except `standard`, `on_hold_daily_limit`, and `cancelled_for_fraud_risk` moved `created` → `scheduled` → `pending` within a minute and stayed `pending` for more than 14 minutes. A payouts funding simulation returned `201` and listed them in a `payout_withdrawal` funding event, which also stayed `pending`. The day before, the same simulation returned `422` "Ledger account balance is zero". This is what those runs on that account showed, not a documented limit, so don't tell a developer that Sandbox payouts can or can't settle without a run on their own account showing it. Until one does, test payout `paid`, `failed` after submission, and `reversed` handlers offline with recorded `payout.event.v1` payloads, and say in the test evidence that this run didn't produce them. The paths that do work are in [sandbox-outcomes.md](sandbox-outcomes.md).
