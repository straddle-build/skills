# Bridge and paykeys

Every status, field, and operation in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. Facts marked "Observed in Sandbox" come from Sandbox runs, not from the contract or the docs. For details beyond this page, search the Docs MCP by concept, for example "Bridge widget", "paykeys", "paykey review", or "unblock a paykey".

## What it is

Bridge connects a customer's bank account and returns a paykey: a token that stands for that customer and that account. Charges and payouts take the paykey token instead of bank details. Bridge matches the account holder's name against the customer, so create the customer first ([customers-identity.md](customers-identity.md)).

Ways to create a paykey, each with the customer's `customer_id`, an optional `external_id`, and `config`. The three direct paykey creates also take `metadata`; `createBridgeToken` doesn't:

| Path | Operation | You send | `source` |
| --- | --- | --- | --- |
| Bridge widget | `createBridgeToken`, then the widget in the browser | `customer_id`. The response has a `bridge_token` for the widget. | Depends on how the customer connects. |
| Bank account details | `createBankAccountPaykey` | `routing_number`, `account_number`, and `account_type` (`checking` or `savings`) | `bank_account` |
| Plaid | `createPlaidPaykey` | `plaid_token`, a Plaid processor token | `plaid` |
| Quiltt | `createQuilttPaykey` | `quiltt_token`, a Quiltt processor token | `quiltt` |

`source` can also be `straddle`, `mx`, or `tan`. Straddle's docs describe a Mastercard Open Finance path, but API contract 1.0.4 has no Mastercard operation, so it's outside the public contract and isn't run ([Public contract only](writes-and-approval.md#public-contract-only)). Straddle's docs say the widget's success callback fires for paykeys in `active` or `review`, so check the returned status there too.

The three paykey creates run only through the SDK or CLI after approval ([writes-and-approval.md](writes-and-approval.md)).

**The token.** A payment's `paykey` field takes the full token, not the paykey `id`. A paykey create returns the full token in `data.paykey`: use that value for the charge or payout that follows, and store it encrypted. Get and list responses mask it. `revealPaykey` and `getUnmaskedPaykey` recover the token of an existing paykey whose token your app didn't keep: both run only through the SDK or CLI after approval, and `getUnmaskedPaykey`, which also unmasks the bank details, needs Straddle to enable unmasking for the account (`allow_data_unmask`). The `paykey.created.v1` and `paykey.event.v1` payloads carry the full token too. Treat it as a secret: store it encrypted, and never log it or send it to a browser. [Idempotency](writes-and-approval.md#idempotency) has the handling rules.

**More than one method.** An app can offer several of these paths, for example Plaid first and bank account details as the fallback. Each is its own create with its own `source`, and every paykey belongs to the same customer, so the rest of the flow doesn't change. A customer who connected through Plaid Link with a Plaid processor token keeps that path with `createPlaidPaykey`; moving Link itself to the Bridge widget is the other option. Plaid Transfer and Plaid Identity Verification are a migration, not a bank connection ([straddle-migrate](../../straddle-migrate/references/providers/plaid.md)).

## The object chain

Each pay-by-bank flow is one chain. The Bridge session and each paykey carry the customer's `customer_id`, and a charge or payout carries the paykey token, not its `id`:

| Step | Operation | Links to the step before by | Accepts `external_id` | Accepts `metadata` |
| --- | --- | --- | --- | --- |
| Customer | `createCustomer` | nothing | yes | yes |
| Bridge session | `createBridgeToken` | `customer_id` | yes | no |
| Paykey | `createBankAccountPaykey`, `createPlaidPaykey`, `createQuilttPaykey` | `customer_id` | yes | yes |
| Charge | `createCharge` | `paykey` (the token) | yes | yes |
| Payout | `createPayout` | `paykey` (the token) | yes | yes |
| Events | `customer.event.v1`, `paykey.event.v1`, `charge.event.v1`, `payout.event.v1` | the resource `id` in `data` | | |

The yes and no come from each create's request schema in API contract 1.0.4. `createBridgeToken` takes no `metadata`. The contract describes its `external_id` as "Unique identifier for the paykey in your system", which says it's meant for the paykey the widget makes; that hasn't been confirmed in Sandbox here.

- **Your identifiers.** Put your own ID in `external_id` on every create that accepts it, and your other keys, such as an order ID or app user ID, in `metadata` where accepted. Customer, charge, and payout events carry `external_id` and `metadata` back in `data`. Paykey events carry the paykey `id`, `customer_id`, and `metadata`, but no `external_id`. Match a paykey event by `data.id` against the paykey `id` you stored, or by a `metadata` key the plan approved that is unique per paykey. A customer can have several paykeys, such as a primary and a fallback, so `customer_id` only confirms which customer owns the paykey and never picks one.
- **Correlate by the chain, not by your order ID.** Store each returned `id` with your record: customer `id` on the user, paykey `id` on the bank account, charge `id` on the order. A per-order trace or support view joins those stored IDs; it doesn't send your order ID through every route.
- **Request logs.** Log the operation, the returned `id`, `status`, and the HTTP status code. The paykey token isn't its `id`: log the paykey `id`, never `paykey`, and keep the token encrypted.

## States and transitions

`status` is `pending`, `active`, `review`, `rejected`, `blocked`, or `inactive`. Only `active` paykeys can be used for payments.

| Status | How it gets there | What you can do |
| --- | --- | --- |
| `pending` | Verification is running. | Wait for the event. |
| `active` | Verification passed, a review was accepted, or a block was lifted. | Create payments, `cancelPaykey`. |
| `review` | Verification needs a decision. | `getPaykeyReview`, then `setPaykeyVerificationDecision`. |
| `rejected` | Verification failed, or a review was rejected. | Nothing. Ask for another account. |
| `blocked` | Returns made the bank account unsafe, such as an R29. The block is on the bank account, so every paykey made from it is `blocked`. | `unblockPaykey` once, when `unblock_eligible` is `true`. |
| `inactive` | Cancelled. | Nothing. Cancelling can't be undone. |

- **Review.** `getPaykeyReview` returns `paykey_details` and `verification_details`: a `decision` (`accept`, `reject`, or `review`), `messages`, and a `breakdown` with `name_match` (`names_on_account`, `matched_name`, `customer_name`, `correlation_score`, `decision`, `reason`, `codes`) and `account_validation` (`decision`, `reason`, `codes`). Decide with `setPaykeyVerificationDecision` and `status` `active` or `rejected`, only while the paykey is `review`. `refreshPaykeyReview` starts a new review asynchronously. Observed in Sandbox: a decision on an `active` paykey returned `422`.
- **R29 block and the one unblock.** An R29 return blocks the bank account: every paykey created from it, for any customer, moves to `blocked` with `status_details.code` R29, and Straddle refuses a new link of that account (Straddle confirmed on 2026-10-01 that this is intended; see [returns-and-disputes.md](returns-and-disputes.md)). `unblock_eligible` is `true` only for an R29 block that has never been unblocked, `false` for other blocks, and `null` when the paykey isn't blocked. `unblockPaykey` (optional `message`) lifts it once. Observed in Sandbox: the unblock returned the paykey to `active` with `source` `user_action`, and payments created during the block failed with `invalid_paykey`.
- **Cancel.** `cancelPaykey` (optional `reason`) moves the paykey to `inactive` for good. Observed in Sandbox: `status_details.reason` `cancel_request`, `source` `user_action`.
- **Balance.** `refreshPaykeyBalance` starts a balance refresh and returns before it finishes. `balance.status` is `pending`, `completed`, or `failed`, and `balance.account_balance` holds the result in cents.
- `expires_at`, when set, is when the paykey stops working.

## What your app must handle

- Save the paykey `id`, the `label` for display, and the token as a secret, keyed to your customer.
- Create payments only on `active` paykeys. On `review`, either decide it yourself with the review evidence, or show "verifying your bank account" until an event settles it.
- On `rejected`, ask for another bank account or another connection method.
- On `blocked`, stop payments on that paykey and on every other paykey from the same bank account, and tell the customer. Offer the unblock only when `unblock_eligible` is `true`, and only after the customer confirms the debit was authorized, because there's no second one. A new link of an R29-blocked account fails, so ask for another account instead.
- Let customers remove a bank account with `cancelPaykey`, and stop using the token right away.
- Expect the paykey to change status after creation, and project it from events, not from the create response.

## Events and Sandbox outcomes

- `paykey.created.v1` on create and `paykey.event.v1` on every change: verification, review decisions, blocks, unblocks, cancels, and balance refreshes ([webhooks.md](webhooks.md)). An R29 sends a block event for every paykey on that bank account.
- Observed in Sandbox on 2026-10-01: the R29 `paykey.event.v1` block events carried `status_details` with `code` R29, `message`, `reason` "Disputed", and `source` "Watchtower", but no `changed_at`. Those `reason` and `source` values are outside the contract's lists, which spell them `disputed` and `watchtower`, so a handler must accept and log unknown values, not reject the event. A projection that orders by `data.status_details.changed_at` ([webhooks.md](webhooks.md)) orders these events by `data.updated_at` instead, and must not drop them.
- The event schema lists fewer `status_details.reason` values than the REST schema ([webhooks.md](webhooks.md)). Don't reject an event for an unknown reason.
- Sandbox: set `config.sandbox_outcome` on the create to `standard`, `active`, `review`, or `rejected`. Observed in Sandbox with bank account details: `active`, `review`, and `rejected` were set in the create response, and `standard` ran the real checks and returned `rejected` (`failed_verification`, `watchtower`) for the test identity. A charge with `failed_not_authorized` blocked every paykey made from that bank account with R29, so give each dispute test its own account number. See [sandbox-outcomes.md](sandbox-outcomes.md).
