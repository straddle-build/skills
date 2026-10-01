# Charges

Every status, field, and operation in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. Facts marked "Observed in Sandbox" come from Sandbox runs, not from the contract or the docs. For details beyond this page, search the Docs MCP by concept, for example "payment statuses" or "charges".

## What it is

A charge pulls money from a customer's bank account over ACH (`payment_rail` is `ach`). You create it against a paykey token, and Straddle submits it on its `payment_date` unless it's on hold. A create needs:

- `paykey`: the full paykey token, not the paykey `id` ([bridge-and-paykeys.md](bridge-and-paykeys.md)).
- `amount` in cents and `currency` `USD`.
- `payment_date`: a US Eastern calendar date ([Payment dates](writes-and-approval.md#payment-dates)).
- `consent_type`: `internet` or `signed` ([ach-timing-and-consent.md](ach-timing-and-consent.md)).
- `device.ip_address`, `description`, and `external_id`, which must be unique across charges.
- `config.balance_check`: `enabled`, `required`, or `disabled`. Use `enabled`: Straddle checks the balance when it can, and when it can't, as for a paykey made from a routing and account number, the charge still goes out. `required` fails the charge when the balance can't be checked, so don't use it when paykeys come from routing and account numbers. Use `disabled` only for charges timed to land when the customer gets paid, such as on payday.

Optional: `metadata` (up to 20 string pairs), `config.auto_hold` with `config.auto_hold_message`, and `config.sandbox_outcome` in Sandbox.

Link your records to the charge with `external_id`, set to your order or invoice ID, and keep your own IDs in `metadata`. The charge carries `funding_ids`, `trace_ids`, `processed_at` (sent to the network), `effective_at` (settled), and `related_payments` with `has_refund`, `has_resubmit`, and `is_resubmit`.

## States and transitions

The happy path is `created` → `scheduled` → `pending` → `paid`. `pending` is the point of no return: the charge is at the network and nothing stops it.

| Status | Meaning | What you can still do |
| --- | --- | --- |
| `created` | Accepted, awaiting verification. | `updateCharge`, `holdCharge`, `cancelCharge` |
| `scheduled` | Verified and queued for its `payment_date`. | `holdCharge`, `cancelCharge` |
| `on_hold` | Paused by you or by Straddle's risk checks. | `updateCharge`, `releaseCharge`, `cancelCharge` |
| `pending` | Sent to the network. | Nothing. Wait for the outcome. |
| `paid` | Funded. Not final: a later return moves it to `reversed`. | `refundCharge` ([refunds-and-resubmits.md](refunds-and-resubmits.md)) |
| `failed` | Declined or returned before funding. Terminal. | `resubmitCharge` |
| `reversed` | Returned after `paid`. Terminal. | `resubmitCharge` |
| `cancelled` | Stopped before the network. Terminal. | `resubmitCharge` |

The REST status list also has `validating`, which the webhook payload's status list doesn't. Treat a status you don't recognize as "not settled", never as `paid`.

Windows, from the contract:

- `updateCharge` changes `amount`, `description`, `payment_date`, or `metadata` while the charge is `created` or `on_hold`. Straddle's docs also list `scheduled`; the contract doesn't, so don't rely on it.
- `holdCharge` needs `created` or `scheduled`. `releaseCharge` moves `on_hold` back to `created`, which then reschedules. `cancelCharge` needs `created`, `scheduled`, or `on_hold`.
- After `pending`, hold, release, cancel, and update return `422`. Observed in Sandbox: holding a `paid` charge returned `422` with "Unable to change status of a payment once it is Pending."

Every change is recorded twice. `status_details` has the latest change's `reason`, `source`, `code` (the ACH return code, when there is one), `message`, and `changed_at`. `status_history` is the ordered list of every change with the same fields plus `status`. Observed in Sandbox: a charge logs three `pending` entries (sent, posted to the customer's bank, received from it), so the same status can appear more than once in a row.

`status_details.source` says who made the change:

| `source` | Meaning |
| --- | --- |
| `system` | Normal progress, `reason` `ok`. |
| `watchtower` | Straddle's risk checks: holds (`risk_review`, `amount_too_large`, `auto_hold`), balance checks (`insufficient_funds` before submission), and blocks (`payment_blocked`, `invalid_paykey`). |
| `bank_decline` | An ACH return from the customer's bank ([returns-and-disputes.md](returns-and-disputes.md)). |
| `customer_dispute` | An unauthorized return, `reason` `disputed`. |
| `user_action` | Your hold, release, or cancel, `reason` `user_request`. |

Holds:

- An `on_hold` charge with `source` `user_action` is yours to release or cancel.
- An `on_hold` charge with `source` `watchtower` is Straddle's. Straddle's docs say only Straddle releases it. Observed in Sandbox: `releaseCharge` released an `amount_too_large` hold, and the charge went on to `pending`. Don't build on that.
- `config.auto_hold` creates the charge on hold, with `reason` `auto_hold`, so you can release it after your own review.

Balance checks: `required` fails the charge before submission when Straddle can't confirm the balance, `enabled` checks when it can, and `disabled` skips the check. A balance failure is `failed` with `source` `watchtower` and `reason` `insufficient_funds`, and no money moved. Observed in Sandbox: `required` on a paykey created from bank account details failed within 8 seconds with "Unable to retrieve balance information from customer's account."

## What your app must handle

- Store the charge `id` and your `external_id`, and set the order state from events, not from the create response. A create returns `created`.
- Fulfill on `paid`, and keep handling the charge afterward. A `reversed` can arrive days later ([returns-and-disputes.md](returns-and-disputes.md)).
- Show `failed` and `reversed` with the `status_details.reason` and `code`, and choose the next step by reason: resubmit, ask for another bank account, or stop.
- Offer hold, cancel, and edit only while the status allows it, and handle the `422` when a race moves the charge to `pending` first.
- Tell a `watchtower` hold from your own. Show the customer "under review" for Straddle's holds and don't promise a release.
- Project status by `status_details.changed_at`, not arrival order ([Ordering status changes](receiving-webhooks.md#ordering-status-changes)), and ignore a repeated status.
- Upload proof of authorization when Straddle or a dispute asks for it ([returns-and-disputes.md](returns-and-disputes.md)).

## Events and Sandbox outcomes

- `charge.created.v1` on create, and `charge.event.v1` on create and on every status change. Both carry the whole charge in `data` ([webhooks.md](webhooks.md)).
- Funding: a paid charge lands in a `charge_deposit` funding event, and a reversal in a `charge_reversal` event ([funding-and-reconciliation.md](funding-and-reconciliation.md)).
- Sandbox: set `config.sandbox_outcome` to drive each path. The observed status paths for all 13 outcomes are in [sandbox-outcomes.md](sandbox-outcomes.md).
