# Refunds and resubmits

Every status, field, and operation in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. Facts marked "Observed in Sandbox" come from Sandbox runs, not from the contract or the docs. For details beyond this page, search the Docs MCP by concept, for example "resubmit a charge" or "refund a charge".

## What it is

- **Resubmit** retries a payment that didn't complete. `resubmitCharge` or `resubmitPayout` creates a new payment from a `failed`, `reversed`, or `cancelled` one. It copies the paykey, `amount`, and other details from the original. The request can set only `description`, `external_id`, and `payment_date`, which default to the original description, a new external ID, and today.
- **Refund** returns money from a `paid` charge. `refundCharge` creates a payout to the bank account the charge came from. `amount` is in cents, like every Straddle amount, and optional: omit it or send `null` for a full refund, or send more than zero and no more than the charge amount for a partial one (2000 refunds $20). The request can also set `description`, `external_id`, `payment_date`, and `metadata`. The charge stays `paid`.

Both link the payments through `related_payments`, a list of `id`, `payment_type`, and `relationship`:

| Payment | Flags | `related_payments` entry |
| --- | --- | --- |
| Resubmitted payment (new) | `is_resubmit` `true` | `relationship` `original`, pointing at the payment it retries |
| Original that was resubmitted | `has_resubmit` `true` | `relationship` `resubmit`, pointing at the new payment |
| Refund payout (new) | `is_refund` `true` | `relationship` `original`, pointing at the charge |
| Refunded charge | `has_refund` `true` | `relationship` `refund`, pointing at the payout |

## States and transitions

A resubmit or refund is an ordinary new charge or payout and follows the lifecycle in [charges.md](charges.md#states-and-transitions) or [payouts.md](payouts.md#states-and-transitions). The rules around them:

- **Resubmit only from `failed`, `reversed`, or `cancelled`.** Observed in Sandbox: resubmitting a `paid` charge returned `422` "Charge is not valid to be resubmitted."
- **Refund only a `paid` charge.** Observed in Sandbox: refunding a `failed` charge returned `422` "Charge is not valid to be refunded", and an `amount` above the charge returned `422` with an `error.items` entry whose `reference` is `amount` ([errors-and-limits.md](errors-and-limits.md)).
- **One resubmit per payment, and one refund per charge.** A resubmit that fails can be resubmitted in turn, which makes a chain. Observed in Sandbox: a second resubmit, and a second refund, each returned `201`, and a second later Straddle's risk checks cancelled the duplicate (`cancelled`, `payment_blocked`, `watchtower`, "has already been refunded on PayoutId" or "has already been resubmitted on ChargeId"). The original listed only the first in `related_payments`.
- **A blocked paykey blocks both.** Observed in Sandbox: while the paykey was blocked by R29, a resubmit and a refund payout both failed within a second (`invalid_paykey`, `watchtower`, R29).
- **`paid` can still become `reversed`.** A refunded charge can be returned later, and then the customer has the money back twice.
- **Resubmit when the reason allows it.** R01 and R09 (`insufficient_funds`) can be retried within Nacha's reinitiation limits, which Straddle's docs give as 180 days from the original settlement. Don't resubmit account problems (`closed_bank_account`, `invalid_bank_account`) or disputes (`disputed`) without a new bank account or a new authorization ([returns-and-disputes.md](returns-and-disputes.md)).

## What your app must handle

- Give every deliberate resubmit or refund attempt its own idempotency key and `external_id`, and reuse them only to retry that same attempt ([Idempotency](writes-and-approval.md#idempotency)).
- Check `has_refund` or `has_resubmit` before offering the action again, and treat a `cancelled` duplicate with `payment_blocked` as "already done", not as a failure to retry.
- Link the new payment to your order through `related_payments`, not through `description` text.
- Show a refund as a payout in progress: it's done at `paid`, and it can fail like any payout.
- Handle a refunded charge that's later `reversed`: flag it and recover the double payment.
- Stop an automatic resubmit schedule on any reason other than `insufficient_funds`.

## Events and Sandbox outcomes

- A resubmit sends `charge.created.v1` and `charge.event.v1` (or the payout events) for the new payment.
- A refund sends `payout.created.v1` and `payout.event.v1`. Existing payout handlers track it, with `is_refund` set.
- Sandbox: resubmit a charge created with `failed_insufficient_funds`, and refund one created with `paid`. Observed in Sandbox: the new payment's `config.sandbox_outcome` is `standard` and can't be set, so it stays `scheduled` like any `standard` payment, and in the ME-896 runs a refund payout didn't reach `paid` ([payouts.md](payouts.md#events-and-sandbox-outcomes)). The default `external_id` of a resubmit was the original's plus `-resubmit-1`, and a refund's default `description` was "Refund for ChargeId:" plus the charge ID.
