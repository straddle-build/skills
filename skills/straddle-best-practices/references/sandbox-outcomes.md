# Sandbox outcomes

Every status, field, and value in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. The status paths on this page were observed in Sandbox on 2026-09-30 on a SaaS account, with a verified customer and an `active` paykey created from bank account details. They aren't a documented contract: re-check them when a scenario disagrees. For details, search the Docs MCP by concept, for example "sandbox simulation".

## What it is

In Sandbox, `config.sandbox_outcome` on a create picks what happens next, so each handler can be driven on purpose. It exists on customers (`SimulatedCustomerOutcome`), paykeys (`SimulatedPaykeyOutcome`), and charges and payouts (`SimulatedPaymentOutcome`). Two more operations simulate what outcomes can't: `simulateFundingEvent` and `simulateAccountOnboarding`. None of this exists in production.

## States and transitions

Customers, with `config.sandbox_outcome` on the customer create:

| Value | Observed result | Tests |
| --- | --- | --- |
| `verified` | `verified` in the create response. | The happy path. |
| `review` | `review` in the create response. | The review queue and `setCustomerVerificationDecision`. |
| `rejected` | `rejected` in the create response. | Blocking a rejected customer. |
| `standard` | The real checks ran. A synthetic identity came back `review` (the reputation module decided `review`). | Real review evidence. The result depends on the identity you send. |

Paykeys, with `config.sandbox_outcome` on any Bridge create:

| Value | Observed result | Tests |
| --- | --- | --- |
| `active` | `active` in the create response. | The happy path. |
| `review` | `review`. `setPaykeyVerificationDecision` then moved it to `active`. | Paykey review. |
| `rejected` | `rejected`, `failed_verification`. | Asking for another account. |
| `standard` | The real checks ran and returned `rejected` (`failed_verification`, `watchtower`) for the test identity. | Real verification. |

Charges and payouts, with `config.sandbox_outcome` on the create. Times are from creation:

| Value | Charge: observed `status_history` | Payout: observed | Tests |
| --- | --- | --- | --- |
| `standard` | `created` → `scheduled`, then stayed `scheduled` for more than 10 minutes. | Same. | Hold, update, release, and cancel windows. |
| `paid` | `created` → `scheduled` (5 s) → `pending` (50 s) → `pending` twice more → `paid` (2 min). | Stayed `pending`. | Fulfillment on `paid`. |
| `on_hold_daily_limit` | `created` → `on_hold` (`amount_too_large`, `watchtower`, 5 s). `releaseCharge` → `created` → `scheduled` → `pending`. | `on_hold`, same reason. | A Straddle hold and limit messaging. |
| `cancelled_for_fraud_risk` | `created` → `failed` (`payment_blocked`, `watchtower`, 5 s). Not `cancelled`. | Same. | A blocked payment. |
| `cancelled_for_balance_check` | With `balance_check` `enabled`: the `paid` path up to `pending`, then stayed `pending`. With `required`: `created` → `failed` (`insufficient_funds`, `watchtower`, 8 s). Never `cancelled`. | Stayed `pending`. | A failed balance check, with `required`. |
| `failed_insufficient_funds` | … → `pending` → `failed` (`insufficient_funds`, `bank_decline`, R01, 2 min). | Stayed `pending`. | Failure and `resubmitCharge`. |
| `failed_closed_bank_account` | … → `failed` (`closed_bank_account`, `bank_decline`, R02). | Stayed `pending`. | Asking for another account. |
| `failed_customer_dispute` | … → `failed` (`disputed`, `customer_dispute`, R05). | Stayed `pending`. | Dispute handling before funding. |
| `failed_not_authorized` | … → `failed` (`disputed`, `customer_dispute`, R29). The paykey went `blocked` (R29, `unblock_eligible` `true`) 2 s later. The block is on the bank account: on 2026-10-01, every paykey made from the same routing and account number, across customers, went `blocked`, and a new link of that account failed with `422`. | Stayed `pending`. | The R29 block and the one-time unblock. |
| `reversed_insufficient_funds` | … → `pending` → `paid` and `reversed` (`insufficient_funds`, `bank_decline`, R01), both at one `changed_at`, 5 min after `pending`. Needs a charges funding simulation. | Stayed `pending`. | A return after `paid`. |
| `reversed_closed_bank_account` | Same, with `closed_bank_account` and R02. | Stayed `pending`. | A return after `paid`. |
| `reversed_customer_dispute` | Same, with `disputed`, `customer_dispute`, and R05. | Stayed `pending`. | A dispute after `paid`. |
| `reversed_not_authorized` | Same, with `disputed`, `customer_dispute`, and R29. | Stayed `pending`. | A dispute after `paid`. |

Every charge path above logged `pending` three times (sent, posted, received), and failures and reversals kept the full `status_history`. In the ME-896 runs, payouts didn't leave `pending` ([payouts.md](payouts.md#events-and-sandbox-outcomes)). A resubmit or refund can't carry a `sandbox_outcome`: its `config.sandbox_outcome` is `standard` ([refunds-and-resubmits.md](refunds-and-resubmits.md#events-and-sandbox-outcomes)).

### Funding and account simulations

- **`simulateFundingEvent`** with `funding_event_job_type` `charges` or `payouts`, and an optional `sandbox_outcome` for the funding event (default `standard`), makes a funding event for the account's unfunded activity. It's account-wide. Observed: a charges simulation made a `pending` `charge_deposit`, and a payouts simulation made a `pending` `payout_withdrawal` ([funding-and-reconciliation.md](funding-and-reconciliation.md#events-and-sandbox-outcomes)).
- **Timing for reversal outcomes.** A reversal outcome reaches `paid` before `reversed` only when a charges simulation runs after its funds are released and before its return. Observed: a simulation 76 seconds after `pending` worked. Test's [funding sweep recipe](../../straddle-test/steps/04-sandbox.md#funding-sweep-for-the-return) has the window and its account-wide side effects.
- **`simulateAccountOnboarding`** with `final_status` `onboarding` or `active` moves a Sandbox account's status without review ([platforms.md](platforms.md)). Not run for this page.

## What your app must handle

A Sandbox test run proves the handlers, not only the happy path. Pick the rows the plan covers:

| Scenario | Create with | Must observe through the notification path | Proves |
| --- | --- | --- | --- |
| Happy path | Customer `verified`, paykey `active`, charge `paid` | `paid` | Fulfillment |
| Customer review | Customer `review` | `review`, then your decision's status | Review queue |
| Paykey review | Paykey `review` | `review`, then `active` or `rejected` | Paykey review |
| Failure before funding | Charge `failed_insufficient_funds` | `failed` with R01 | Failure handling and resubmit |
| Return after paid | Charge `reversed_insufficient_funds`, plus a funding simulation | `paid`, then `reversed` with R01 | Clawback after fulfillment |
| Dispute and R29 block | Charge `failed_not_authorized` on a paykey made from a bank account number no other scenario, run, or demo uses | `failed` with R29, paykey `blocked` | Dispute handling and the unblock |
| Straddle hold | Charge `on_hold_daily_limit` | `on_hold` with `amount_too_large` | Hold messaging |
| Blocked payment | Charge `cancelled_for_fraud_risk` | `failed` with `payment_blocked` | Blocked-payment messaging |
| Refund | Charge `paid`, then `refundCharge` | A payout with `is_refund` | Refund linking. The payout wasn't observed reaching `paid` ([payouts.md](payouts.md#events-and-sandbox-outcomes)). |
| Payout (optional) | Payout `paid`, plus a payouts funding simulation, run only with the developer's approval | `paid` when the account settles it; otherwise record each status that didn't arrive as `not observed` | Payout handling against live events. Offline payout tests stay required ([payouts.md](payouts.md#events-and-sandbox-outcomes)). |
| Cancel window | Charge `standard`, then `holdCharge`, `releaseCharge`, `cancelCharge` | `on_hold`, `created`, `cancelled` | User actions |
| Funding | A charges funding simulation | `funding_event.created.v1` and `funding_event.event.v1` | Reconciliation |

Rules for the run:

- Count a status only when it arrives through the webhook, FIFO, or polling endpoint. A create response only shows `created`.
- Give each run's resources fresh external IDs, because the simulations and a new polling consumer also show other testers' activity on the account. Give each customer the run creates a fresh email too, because a customer's email is unique on the account and a repeated one fails with `422` ([customers-identity.md](customers-identity.md)).
- Give each dispute and R29 scenario its own bank account number, never one another scenario or the developer's demo uses. The R29 blocks every paykey made from that account, across customers, and refuses new links of it.
- Cover payout handlers with recorded payloads ([payouts.md](payouts.md#events-and-sandbox-outcomes)), and record whether this run observed a payout reaching `paid`.

## Events and Sandbox outcomes

Each outcome produces the ordinary events for its path: `customer.event.v1`, `paykey.event.v1`, `charge.event.v1`, `payout.event.v1`, and `funding_event.event.v1`, each also with its `.created.v1` event ([webhooks.md](webhooks.md)). Expect repeats: Test's funding sweep notes say a simulation can re-emit `paid` for earlier charges under new event IDs.
