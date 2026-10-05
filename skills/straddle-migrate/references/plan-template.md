# Straddle migration plan

- Plan state: Draft | Approved | Blocked
- Approval: none | date, "the developer's words", rows approved, recorded by straddle-migrate, sha256 of the plan (see [step 5](../steps/05-approval.md)) | date, "the developer's words", recorded by straddle-test, sha256 of the plan

Provider: `<provider>` (reference: `references/providers/<file>.md`)
Integration model: `<direct / SaaS / marketplace / Unresolved>`
SDK: `<package and version / Unresolved>`
Notification path: `<webhook endpoint / FIFO endpoint / polling endpoint / Unresolved>`
Switch: `<flag or setting name, default>`

## Current provider footprint

| Call site | Flow | Provider API or event |
| --- | --- | --- |
| `path:line` | | |

## Flows in scope

| Flow | Straddle operation | Account scope | Doc citation |
| --- | --- | --- | --- |

## Status mapping

Every provider status the application stores or reacts to, mapped to a Straddle status of the same kind of resource and to the application's own state. Keep one table per resource, and delete a table the migration doesn't use.

Payments (Transfer and other money movement): the Straddle payment status (`created`, `scheduled`, `validating`, `pending`, `on_hold`, `paid`, `failed`, `cancelled`, `reversed`).

| Provider status or event | Straddle payment status | Application state | Where handled |
| --- | --- | --- | --- |

Identity (Plaid Identity Verification and other KYC): the Straddle customer status (`pending`, `review`, `verified`, `rejected`, `inactive`). Never map an identity status to a payment status.

| Provider status or event | Straddle customer status | Application state | Where handled |
| --- | --- | --- | --- |

## Returns, corrections, and retries

For payment flows. An identity-only migration writes `None: no payment flow`, plus the customer create's idempotency key formula and its length.

- Returns before `paid` (`failed`) and after `paid` (`reversed`): how the application reacts to each, keyed on the Straddle return code.
- Notifications of change: what Straddle does with corrections (with the source), and what the application must still handle.
- Retries: which return codes may be re-presented, and how: Straddle resubmit or a fresh create, each with its own idempotency key of 10 to 40 characters. For every create, resubmit, and retry key, give the concrete derivation and its length, prefix included, for example `pyo-` plus the first 32 hex characters of the SHA-256 of `payout:<run id>:<employee id>:<attempt>`, which is 36 characters. A key that embeds a raw, unbounded identifier, such as `payout:<run id>:<employee id>:attempt-<n>`, is not allowed.
- Accounts to stop debiting after fatal returns: what Straddle does (with the source), and what the application must still do.

## Consent

For payment flows. An identity-only migration writes `None: no payment flow`.

- Existing authorization wording and whose name it carries: `<quote or summary>`
- Decision: re-authorize on the Straddle path | reuse existing authorizations | `Unresolved`
- Decided by: `<person or role>`
- `consent_type` per flow (`internet` or `signed`), and flows with no matching `consent_type` value (for example TEL).

## Bank accounts on the Straddle path

For payment flows. An identity-only migration writes `None: no payment flow`.

- New customers: link through `<Bridge widget / Plaid processor token with straddle / direct bank details>`.
- Existing customers: re-link through Bridge when they move to the Straddle path. Using stored provider data (for example minting Straddle tokens from existing Plaid Items) is customer-data migration; this plan does not implement it.

## Notifications

| Provider event or polling code | Straddle event | Handler |
| --- | --- | --- |

The old provider handler stays for payments still on the provider.

## In-flight payments

For payment flows. Payments already submitted, scheduled, or future-dated on `<provider>` finish there. Refunds and late returns for them keep flowing through `<provider>` (unauthorized returns can arrive up to 60 days later). An identity-only migration writes `None: no payment flow`.

## Authorized modifications

Only these files change. Each change is additive.

| # | Path | Change | What is added | Flow / call site |
| --- | --- | --- | --- | --- |
| 1 | | create / modify (additive) | | |

## Blocked

Files that need a change but had uncommitted work, or changes this skill does not make (delete, rename, replace).

## Not moved

Customer records, bank accounts, provider tokens, mandates and authorizations, and payment history stay with `<provider>`. This plan does not export, copy, or re-create them in Straddle.

## Verification

- Test command: `<command>`
- New tests: `<paths>`
- Status-mapping tests cover every row of each status mapping table: for payments, including `failed` vs `reversed`; for identity, each customer status the app reacts to, fed recorded `customer.event.v1` payloads.
- Sandbox proof: run straddle-test after review. Payments use charge `sandbox_outcome` values for `paid`, `failed_*`, and `reversed_*`. Sandbox payouts don't reach `paid` today, so payout `paid`, `failed`, and `reversed` handling is covered by the offline tests with recorded event payloads. Identity uses customer `sandbox_outcome` values `verified`, `review`, and `rejected`. An identity-only migration needs no payment tests or charge scenarios.

## Unresolved
