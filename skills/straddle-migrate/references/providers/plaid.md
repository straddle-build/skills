# Plaid

Three integrations hide behind "Plaid": **Auth/Link with a processor** (Plaid links the account, another company moves money), **Plaid Transfer** (Plaid moves money), and **Plaid Identity Verification** (Plaid verifies the person). Establish which ones the code uses first. Transfer and Identity Verification are what Migrate moves. For an existing Plaid Link app, the plan names both new-link options: keep Plaid Link and request a `straddle` processor token, which Straddle turns into a paykey through `POST /v1/bridge/plaid` (`createPlaidPaykey`), or move Link to the Bridge widget. Moving bank linking to Straddle covers both. Record the developer's choice, the answer an approved `straddle-integration-plan.md` already gives, or `Unresolved`.

## Find it

- Packages: npm `plaid`, `react-plaid-link`; PyPI `plaid-python`; gem `plaid`; Go `github.com/plaid/plaid-go/vNN/plaid`; Maven `com.plaid:plaid-java`. No official NuGet package was found.
- Strings: `linkTokenCreate`, `itemPublicTokenExchange`, `processorTokenCreate`, `authGet`, `transferAuthorizationCreate`, `transferCreate`, `transferIntentCreate`, `transferRecurringCreate`, `bankTransferCreate`, `transferEventSync`, `TRANSFER_EVENTS_UPDATE`, `identityVerificationCreate`, `identityVerificationGet`, `/identity_verification/`, a Link token whose `products` include `identity_verification`, `Plaid-Verification`, `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, `cdn.plaid.com/link`.

## Auth/Link with a processor

- Plaid lists `straddle` as a processor for `/processor/token/create` ([processors](https://plaid.com/docs/api/processors/)), once the Straddle integration is enabled in the Plaid Dashboard ([Plaid and Straddle](https://plaid.com/docs/auth/partnerships/straddle/)). Straddle creates a paykey from that token with `POST /v1/bridge/plaid`.
- For **new** links the Straddle path keeps Plaid Link and requests a `straddle` processor token instead of (or beside) the old processor's token. That is additive code and in scope.
- For **existing** Items, the same access token can mint a `straddle` processor token without the customer re-linking. That uses stored customer data to create Straddle paykeys, so it is customer-data migration: this skill never implements it. Record it in the plan's Not moved section.
- Straddle uses Plaid Auth, Identity, and Balance. Items created before the switch may lack Identity consent.
- Revoking an Item with `/item/remove` kills every processor token minted from it, including Straddle's.

## Plaid Transfer

| Plaid Transfer | Straddle |
| --- | --- |
| `/transfer/authorization/create` then `/transfer/create`, `type: debit` | charge (no separate authorization step) |
| `type: credit`, refunds | payout |
| Ledger sweeps | funding events |
| Transfer for Platforms originator | embedded account; Plaid's platform product is SaaS-shaped |
| `idempotency_key` in the body; `/transfer/create` idempotent on `authorization_id` | `Idempotency-Key` header |

Status mapping ([reading transfers](https://plaid.com/docs/api/products/transfer/reading-transfers/)):

| Plaid Transfer | Straddle |
| --- | --- |
| `pending`, `posted` | `pending` |
| `settled` (credit) or `funds_available` (debit) | `paid` |
| `failed` | `failed` |
| `returned` | `failed` or `reversed` depending on whether the payment had reached `paid`, with the return code |
| `cancelled` | `cancelled` |

Plaid allows at most two retries, only for R01 and R09, marked with "Retry 1" and "Retry 2" descriptions; R10 can't be resubmitted. That convention does not port: on Straddle, a retry creates a new Straddle charge, either through resubmit (`POST /v1/charges/{id}/resubmit`, which copies a failed, reversed, or cancelled charge and takes an idempotency key) or a fresh create. The Plaid Transfer docs reviewed describe no NOC object.

## Plaid Identity Verification

Straddle verifies identity when the app creates a customer, so a Plaid verification session becomes a customer create and its review ([customers-identity.md](../../../straddle-best-practices/references/customers-identity.md)).

| Plaid Identity Verification | Straddle |
| --- | --- |
| `/identity_verification/create`, or a Link token with `identity_verification` | customer create with `name`, `type`, `email`, `phone`, and `device`, plus `compliance_profile` for the regulated checks |
| session `success` | customer `verified` |
| `failed` | customer `rejected` |
| `pending_review` | customer `review`, decided by the team that owns customer review, with `getCustomerReview` for the evidence |

Confirm the mapping with the developer in step 3. Plaid's document and selfie steps have no Straddle equivalent in API contract 1.0.4; record any the app relies on as Unresolved.

## Consent

Without Plaid's Transfer UI, the merchant already collects and keeps NACHA proof of authorization for at least two years. Whether that authorization must be re-collected for Straddle is a compliance decision; default proposal is a new authorization on the Straddle path.

## Notifications

`TRANSFER_EVENTS_UPDATE` carries no transfer ID; the app calls `/transfer/event/sync` with a cursor to read events ([reconciling transfers](https://plaid.com/docs/transfer/reconciling-transfers/)). Webhooks are verified with an ES256 JWT in `Plaid-Verification` that includes the body's SHA-256 ([webhook verification](https://plaid.com/docs/api/webhooks/webhook-verification/)). The Straddle handler is a new Standard Webhooks route; the event-sync cursor code has no Straddle equivalent beyond the polling endpoint's consumer offset.

## Never moves

Access tokens, link and public tokens, other processors' tokens, raw numbers and tokenized account numbers, Plaid transfer, event, and sweep history, and Plaid Identity Verification sessions and documents. Refunds and late returns on Plaid Transfer payments stay on Plaid. No bulk backfill of Straddle customers from stored identity data: each user gets a Straddle customer when they first use the Straddle path.

## Pitfalls

- Do not remove Items whose Straddle paykeys are live.
- Tokenized account numbers (Chase, PNC, US Bank) break when consent is revoked or expires; the next debit returns R04.
- Items from Database Auth and some micro-deposit flows have no live connection, so identity and balance checks may be weaker.
- Plaid Transfer amounts are decimal strings; Straddle amounts are integer cents.
