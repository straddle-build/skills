# Customers and identity

Every status, field, and operation in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. Facts marked "Observed in Sandbox" come from Sandbox runs, not from the contract or the docs. For details beyond this page, search the Docs MCP by concept, for example "customer review", "identity reason codes", "risk scores", "watchlist screening", or "business identity verification".

## What it is

A customer is the person or business that pays or gets paid. `type` is `individual` or `business`. Creating a customer starts Straddle's identity, fraud, and risk checks, and the result decides whether the customer can transact.

A create needs `name`, `type`, `email`, `phone` (E.164), and `device.ip_address` (`0.0.0.0` for an offline sign-up). `address`, `external_id`, and `metadata` are optional. `compliance_profile` adds the regulated checks:

- **Individuals (KYC):** `dob` and `ssn`.
- **Businesses (KYB):** `ein` and `legal_business_name`, plus optional `website` and `representatives` (each with `name`, `email`, `phone`).

`email` is unique on the account: a create with an email another customer already has fails. Observed in Sandbox on 2026-10-01: `422`, `type` `/validation_error`, `detail` "Email '`<email>`' already exists and must be unique.", with an empty `items` list. Straddle's API reference shows the same rule in its error example, as a `400` whose item is "customer.email", "Email address must be unique." So a customer is one person, not one order or checkout.

Responses mask `compliance_profile`. `getUnmaskedCustomer` returns it unmasked, but only when Straddle has enabled unmasking for the account (`allow_data_unmask` in the account settings' `configuration`). It's one of the operations that run only through the SDK or CLI after approval ([writes-and-approval.md](writes-and-approval.md)). So is `deleteCustomer`, which is for regulatory or privacy requests only and can't be undone.

## States and transitions

`status` is `pending`, `review`, `verified`, `rejected`, or `inactive`.

| Status | Meaning |
| --- | --- |
| `pending` | Checks are running. |
| `review` | The checks need a decision. |
| `verified` | Passed. The customer can transact. |
| `rejected` | Failed. The customer can't transact. |
| `inactive` | Deactivated. |

The review is the evidence behind the status. `getCustomerReview` returns `customer_details` and `identity_details`:

- `identity_details.decision`: `accept`, `reject`, or `review`.
- `identity_details.breakdown`: one entry per check module (`email`, `phone`, `address`, `fraud`, `synthetic`, and for businesses `business_identification`, `business_validation`, and `business_evaluation`). Each has a `decision`, `risk_score` (higher means more likely fraud), `correlation_score` (higher means the details match known records more strongly), `correlation` (`low_confidence`, `potential_match`, `likely_match`, or `high_confidence`), and `codes`.
- `identity_details.messages`: the text for each reason code in the `codes` lists.
- `identity_details.watch_list`: `decision`, `codes`, `matched` (the list names), and `matches`, each with `list_name`, `match_fields`, `urls`, and `correlation`.
- `identity_details.network_alerts`: `decision`, `codes`, and consortium `alerts`. `identity_details.reputation`: `decision`, `codes`, a `risk_score`, and `insights`. `identity_details.kyc`: per-field `validations`, when KYC ran.

The overall `decision` can be `review` or `reject` while every `breakdown` module says `accept`, because `reputation`, `network_alerts`, and `watch_list` each have their own `decision`. Observed in Sandbox on 2026-10-02: on every forced-review customer, all breakdown modules accepted, and the `review` came from `reputation`, with R-codes such as R1022, R1027, and R1046 explained in `messages`.

Decide a review with `setCustomerVerificationDecision` and `status` `verified` or `rejected`. The customer's current `status` must be `review`. Observed in Sandbox: a decision on a `verified` customer returned `422` "Customers with status Verified cannot be changed." `refreshCustomerReview` starts a new review, which runs asynchronously and reports through events. Straddle's docs say an update to identity fields can also start a new verification and change the status.

Identity codes are not ACH return codes. R-codes from identity checks, such as R1022 from the reputation check, are reasons, and I-codes are insights. Don't mix either up with the R-codes in [returns-and-disputes.md](returns-and-disputes.md).

## What your app must handle

- Wait for `verified` before you create paykeys or payments for the customer. Straddle's docs say payments for a customer or paykey under review can be held with `risk_review`. The wait governs every alternative you suggest too: no bank link or paykey and no payment of any size, such as a capped first payment, until the customer is `verified`.
- Decide who reviews. If your team decides, build a queue for `review` customers. Show the reason from each check whose `decision` isn't `accept`, including `reputation`, `network_alerts`, and `watch_list`, not only the breakdown modules: its R-codes with their `messages` text, and watchlist matches. Show module decisions and scores as context. I-codes are insights, not reasons, so don't list them as why the customer is in review. Record who decided and why before calling `setCustomerVerificationDecision`, which works only while the customer's `status` is `review` (above).
- On `rejected`, don't create paykeys or payments, and show the customer a neutral message, never the scores or codes.
- For businesses, collect the KYB fields and representatives up front, and expect more modules in the breakdown.
- Keep PII server-side: send `dob`, `ssn`, and `ein` from your backend, never log them, and don't store them unless you must. Use unmasked reads only when a person needs them, and keep their output out of logs.
- Keep one customer per real buyer, keyed by your app's own ID for that buyer: a login, an account, or a guest record your app finds again when the same buyer comes back. Set the customer's `external_id` to that ID when you create it, store the customer `id` against the buyer, and reuse that customer when the buyer pays again. To find a customer whose `id` you didn't store, use `listCustomers` filtered by `external_id`.
- Never create a customer per checkout or order, and never a new app record per checkout or order that then gets its own customer, because a customer's email is unique on the account (above). This rules out every option you list too, even one whose drawback you name. Don't key a customer on an email typed at checkout when there's no app user behind it. How your app recognizes a returning buyer is your app's decision, and if its own user ID is an email, that's its call.

## Events and Sandbox outcomes

- `customer.created.v1` on create, with the initial status. `customer.event.v1` on every later change, including review decisions and refreshed reviews ([webhooks.md](webhooks.md)).
- Sandbox: set `config.sandbox_outcome` on the create to `standard`, `verified`, `review`, or `rejected`. Observed in Sandbox: `verified`, `review`, and `rejected` were set in the create response (`config.processing_method` `inline`). `standard` ran the real checks and returned `review` for a synthetic test identity, because the reputation module decided `review`. A decision then moved `review` to `verified` or `rejected`. See [sandbox-outcomes.md](sandbox-outcomes.md).
