# Returns and disputes

Every status, field, and operation in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. Facts marked "Observed in Sandbox" come from Sandbox runs, not from the contract or the docs. For details beyond this page, search the Docs MCP by concept, for example "ACH return codes" or "proof of authorization".

## What it is

An ACH return is the customer's bank sending a payment back. It can arrive before the payment is funded or days after it's `paid`. A dispute is a return the customer starts by telling their bank the payment wasn't authorized. Straddle reports both on the payment itself:

- `status` is `failed` when the return arrives before funding, and `reversed` when it arrives after `paid`.
- `status_details.code` is the ACH return code, such as R01.
- `status_details.source` is `bank_decline` for a bank return and `customer_dispute` for an unauthorized one.
- `status_details.reason` maps the code to a Straddle reason.

Straddle also blocks some payments before they reach the network, using what it learned from earlier returns. Those fail with `source` `watchtower` and `reason` `payment_blocked` or `invalid_paykey`.

## States and transitions

A return moves a `pending` payment to `failed`, or a `paid` payment to `reversed`. Both are terminal. `paid` → `reversed` can happen days later, so `paid` never means "done".

The codes that matter most, with the `reason` Straddle's docs map them to:

| Code | `reason` | `source` | What it means | What to do |
| --- | --- | --- | --- | --- |
| R01, R09 | `insufficient_funds` | `bank_decline` | Not enough funds. | Retry later with `resubmitCharge`, within Nacha's reinitiation limits. |
| R02 | `closed_bank_account` | `bank_decline` | Account closed. | Stop. Ask for another bank account. |
| R03, R04 | `invalid_bank_account` | `bank_decline` | No such account, or an invalid number. | Stop. Ask for correct details. |
| R08 | `payment_stopped` | `bank_decline` | The customer stopped this payment. | Contact the customer before trying again. |
| R05, R07, R10, R11 | `disputed` | `customer_dispute` | Unauthorized, authorization revoked, or not per its terms. | Stop debiting. Get a new authorization. Keep your proof. |
| R29 | `disputed` | `customer_dispute` | A business says the debit wasn't authorized. | As for disputes, and the paykey is now `blocked`. |
| R16 | `frozen_bank_account` | `bank_decline` | Account frozen or an OFAC hold. | Stop. |
| R23 | `payout_refused` | `bank_decline` | The receiver refused a payout. | Confirm the details with the customer. |

Other codes arrive as `other_network_return`. Store `code` as you receive it, and don't assume the list is complete.

Consequences of a return:

- **R29 blocks the paykey.** The paykey moves to `blocked` with `status_details.code` R29, and `unblock_eligible` is `true` if it has never been unblocked. You can unblock it once with `unblockPaykey` ([bridge-and-paykeys.md](bridge-and-paykeys.md)). Observed in Sandbox: the block landed two seconds after the charge failed. While it lasted, a new charge, a resubmit, and a refund payout on that paykey all failed within a second with `invalid_paykey`, `watchtower`, and code R29.
- **Earlier returns block later payments.** Straddle's docs describe pre-origination blocks, with `reason` `payment_blocked`, for bank accounts that earlier returned R02, R03, R04, R16, or R20, or had unauthorized returns.
- **Return rates are watched.** Nacha keeps each originator's debit returns, over the preceding 60 days, under 0.5 percent for unauthorized codes (R05, R07, R10, R29, R51), 3 percent for administrative codes (R02, R03, R04), and 15 percent overall.
- **Money moves back.** See [funding-and-reconciliation.md](funding-and-reconciliation.md) for how a reversed charge is funded.

Proof of authorization answers a dispute or a Straddle review. Upload it with `uploadChargeAuthorizationProof` or `uploadPayoutAuthorizationProof` as multipart form data in the `File` field: PDF, PNG, JPEG, DOC, or DOCX, up to 10 MiB, with the content matching the extension. Each upload adds an entry to the payment's `documents` (`document_id`, `document_name`, `document_type` `payment_authorization`, `document_size`, `uploaded_at`) and never replaces one. The payment events carry the same `documents`.

## What your app must handle

- Keep handling a charge after `paid`. On `reversed`, undo what `paid` unlocked: claw back credit, pause the subscription, or flag the order.
- Branch on `status_details.reason` and `code`, not on the message text. Resubmit only `insufficient_funds`. For account problems, ask for a new bank account. For disputes, stop and get a new authorization.
- On R29, show that the bank account is blocked. Offer the one-time unblock only when `unblock_eligible` is `true`, and only after the customer confirms the authorization.
- Keep every authorization record: the consent text, time, IP address, and your customer's identity. Upload it when a dispute or review asks for it.
- Track your own return rates by code, so you see an unauthorized-rate problem before Straddle does.

## Events and Sandbox outcomes

- `charge.event.v1` and `payout.event.v1` carry `failed` and `reversed`, with `status_details.code`.
- `paykey.event.v1` carries the R29 block and the unblock.
- See [funding-and-reconciliation.md](funding-and-reconciliation.md) for funding event notifications and return paths.

Sandbox outcomes that produce returns, observed in Sandbox on 2026-09-30 with charges ([sandbox-outcomes.md](sandbox-outcomes.md) has the full paths):

| `sandbox_outcome` | Result |
| --- | --- |
| `failed_insufficient_funds` | `failed`, `insufficient_funds`, `bank_decline`, R01 |
| `failed_closed_bank_account` | `failed`, `closed_bank_account`, `bank_decline`, R02 |
| `failed_customer_dispute` | `failed`, `disputed`, `customer_dispute`, R05 |
| `failed_not_authorized` | `failed`, `disputed`, `customer_dispute`, R29, and the paykey `blocked` |
| `reversed_insufficient_funds` | `paid`, then `reversed` with R01 |
| `reversed_closed_bank_account` | `paid`, then `reversed` with R02 |
| `reversed_customer_dispute` | `paid`, then `reversed` with R05 |
| `reversed_not_authorized` | `paid`, then `reversed` with R29 |

The four reversal outcomes reach `paid` only with a charges funding simulation at the right time, and `paid` and `reversed` share one `changed_at`. See [sandbox-outcomes.md](sandbox-outcomes.md#funding-and-account-simulations).
