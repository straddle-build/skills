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
- `identity_details.network_alerts`: consortium `alerts`. `identity_details.reputation`: a `risk_score` and `insights`. `identity_details.kyc`: per-field `validations`, when KYC ran.

Decide a review with `setCustomerVerificationDecision` and `status` `verified` or `rejected`. The customer's current `status` must be `review`. Observed in Sandbox: a decision on a `verified` customer returned `422` "Customers with status Verified cannot be changed." `refreshCustomerReview` starts a new review, which runs asynchronously and reports through events. Straddle's docs say an update to identity fields can also start a new verification and change the status.

Identity reason codes (I-codes, and R-codes from the reputation check such as R1022) are not ACH return codes. Don't mix them up with the R-codes in [returns-and-disputes.md](returns-and-disputes.md).

## What your app must handle

- Wait for `verified` before you create paykeys or payments for the customer. Straddle's docs say payments for a customer or paykey under review can be held with `risk_review`.
- Decide who reviews. If your team decides, build a queue for `review` customers that shows the module decisions, scores, `codes` with their `messages`, and watchlist matches, and records who decided and why before calling `setCustomerVerificationDecision`.
- On `rejected`, don't create paykeys or payments, and show the customer a neutral message, never the scores or codes.
- For businesses, collect the KYB fields and representatives up front, and expect more modules in the breakdown.
- Keep PII server-side: send `dob`, `ssn`, and `ein` from your backend, never log them, and don't store them unless you must. Use unmasked reads only when a person needs them, and keep their output out of logs.
- Keep one customer per person. Link your user to the customer by `external_id`, and store the customer `id`.
- Guest checkout can't create a customer per checkout, because a returning shopper's email already belongs to a customer, so the second create fails with `422`. It also can't reuse the customer whose email the shopper typed: anyone who types another shopper's email would inherit that shopper's verified identity and their paykeys. Reuse an existing customer only after the shopper proves they own the email, by logging in or by entering a code you emailed them; a first-time email creates a new customer. Reuse by typed email alone is acceptable only as a Sandbox test convenience, gated to Sandbox in code.

## Events and Sandbox outcomes

- `customer.created.v1` on create, with the initial status. `customer.event.v1` on every later change, including review decisions and refreshed reviews ([webhooks.md](webhooks.md)).
- Sandbox: set `config.sandbox_outcome` on the create to `standard`, `verified`, `review`, or `rejected`. Observed in Sandbox: `verified`, `review`, and `rejected` were set in the create response (`config.processing_method` `inline`). `standard` ran the real checks and returned `review` for a synthetic test identity, because the reputation module decided `review`. A decision then moved `review` to `verified` or `rejected`. See [sandbox-outcomes.md](sandbox-outcomes.md).
