# Straddle integration plan

## Status

- Plan state: Draft | Approved | Blocked
- Approval: none | date, "the developer's words", recorded by straddle-plan, straddle-integrate, or straddle-test, sha256 (see Integrate step 1, Recorded approval)
- Last reviewed:
- Repository and branch:
- Straddle skills version:
- API contract version: 1.0.4, or the version the installed SDK targets
- SDK package and exact installed version:

## Goal

The business outcome, who uses it, and the Straddle products in scope.

## Decisions

The interview's log, in the order asked, with questions numbered across rounds. Plan step 1 writes each row as it's settled and resumes from this table. A decision the repository or Setup settled has no question number.

- Source: `developer`, `developer, accepted recommendation`, `assumption` (the developer didn't know, so this is Plan's recommendation until they confirm it), `Setup`, or the repository `file:line`.
- Answer: the decision, `open (round N)` while it waits for the developer, or `Unresolved` when they left it undecided.

| # | Decision | Answer | Source | Why |
| --- | --- | --- | --- | --- |
| | Integration type | direct (`account`) / SaaS / marketplace | | |
| | Products | charges / payouts / both | | |
| | Bank connection | one or more of Bridge widget / Plaid / Quiltt / bank details, primary first; the Bank connection methods table has a row for each | | |
| | Your identifiers | `external_id` and `metadata` keys per create | | |
| | Read strategy | local projection from events, cache cleared by events and review decisions, safety TTL | | |
| | SDK | TypeScript / Python / Ruby / C# / Go | | |
| | Notification path | webhook endpoint / FIFO endpoint / polling endpoint | | |
| | Customer-facing onboarding (platforms) | hosted iframe | | |
| | Later rounds: review decisions, returns after `paid`, refunds and resubmits, identity mapping, duplicate events, reconciliation, and the rest of the design tree | | | |

## Glossary

Terms the interview settled, in Straddle's meaning where Straddle has one, with no implementation detail.

- **Term**: what it is, in one or two sentences. _Avoid_: other words for it.

## Repository evidence

- Language, framework, package manager:
- Test command:
- Existing payment or bank-linking providers to keep:
- Entry points where Straddle calls belong:
- Existing tests to extend:

## Bank connection methods

One row per method the Bank connection decision chose, in its order: 1 is the primary, each later number a fallback. Delete the rows it didn't choose. Integrate wires every row, and Test runs a Sandbox paykey for each.

| Order | Method | When the app uses it | Create operation | Paykey token |
| --- | --- | --- | --- | --- |
| | Bridge widget | | `createBridgeToken`, then the customer completes the widget in the browser | the full token the app receives for the widget's paykey, stored encrypted; `revealPaykey` only to recover one the app didn't keep. A masked `paykey` from a list or get never goes into a payment |
| | Bank account details | | `createBankAccountPaykey` | `data.paykey` from the create, stored encrypted; `revealPaykey` only to recover one the app didn't keep |
| | Plaid processor token | | `createPlaidPaykey` | `data.paykey` from the create, stored encrypted; `revealPaykey` only to recover one the app didn't keep |
| | Quiltt token | | `createQuilttPaykey` | `data.paykey` from the create, stored encrypted |

## Identifiers and reads

| Create | `external_id` | `metadata` keys |
| --- | --- | --- |
| `createCustomer` | | |
| `createBridgeToken` | | none: the create doesn't accept `metadata` |
| paykey create, per method | | |
| `createCharge` | | |
| `createPayout` | | |

- Read strategy, from the Decisions log: which views read the local projection, which events and review decisions clear the cache, and the safety TTL.
- Logs or activity view: the stored IDs each trace joins, following [The object chain](../../straddle-best-practices/references/bridge-and-paykeys.md#the-object-chain).

## Application flow

Numbered, using the installed SDK's method names with their source file. Remove steps that do not apply.

1. Create or reuse the customer by external ID.
2. Connect a bank account through the method the Bank connection methods table gives for this customer. A paykey create returns the paykey `id` and the full token in `paykey`. For the Bridge widget, `createBridgeToken` returns only a `bridge_token` for the widget, and the paykey comes from the customer completing the widget. Store the token encrypted, and never record it in this plan.
3. Create the charge or payout with that token in `paykey`, plus consent, payment date, external ID, and idempotency key.
4. Receive status changes through the chosen notification path.
5. Reconcile from delivered events.

## Account scope

| Operation | Header for this integration type | Source |
| --- | --- | --- |
| | sent / required / omitted | best-practices account-scope reference |

- How the application selects the acting account:
- How it switches between accounts:
- Missing required account: fails locally with a configuration error and zero requests, proved by:

## Two-account proof (SaaS and marketplace)

- Sandbox account A (external ID):
- Sandbox account B (external ID):
- Charge or payout for each, with the evidence that proves the account on each result:
- Header-omitted operations verified omitted:

## Onboarding (SaaS and marketplace)

- Sandbox testing: accounts created through the API after preview and approval.
- Customer-facing: hosted iframe with `env=sandbox` and a required `externalId`; account resolved through the notification path or an exact external-ID lookup.

## Notifications

- Endpoint type and events subscribed:
- Signature verification helper and raw-body access (FIFO: `svix-*` headers):
- FIFO body shape, from a captured delivery or the dashboard's transformation test output:
- Duplicate handling (event ID storage):
- Acknowledgement: `2xx` after one event is stored (webhook), after the whole batch commits (FIFO), or the polling consumer ID, offset storage, and commit:
- Status transitions to record, including `paid` then `reversed` with `R01`, ordered by `changed_at` with delivery order breaking a tie (best-practices receiving-webhooks reference, Ordering status changes):

## Lifecycle handling

What the app does for each status its notification path delivers, from the Decisions log and the "What your app must handle" section of the named best-practices reference. Keep the rows for the resources in scope.

| Resource | Status or event | What the app does | Decision | Reference |
| --- | --- | --- | --- | --- |
| Customer | `review`, `rejected` | | | `customers-identity.md` |
| Paykey | `review`, `rejected`, `blocked` (R29) and the one-time unblock, `inactive` | | | `bridge-and-paykeys.md` |
| Charge | `paid` | | | `charges.md` |
| Charge | `failed`, and `reversed` after `paid` (R01, disputes) | | | `returns-and-disputes.md` |
| Charge | `on_hold`, `cancelled` | | | `charges.md` |
| Refund and resubmit | `refundCharge` payout, `resubmitCharge` | | | `refunds-and-resubmits.md` |
| Payout | `paid`, `failed`, `reversed` | | | `payouts.md` |
| Funding event | `charge_deposit`, `charge_reversal`, `payout_withdrawal`, `payout_return` | | | `funding-and-reconciliation.md` |
| Account (platforms) | `onboarding`, `active`, `rejected` | | | `platforms.md` |

## Configuration

- `STRADDLE_API_KEY` read from the process environment; a missing key or environment raises a configuration error before any request.
- Environment: Sandbox (`https://sandbox.straddle.com`).

## File changes

| File | Existing or new | Change | Behavior proved | Test |
| --- | --- | --- | --- | --- |
| | | | | |

## Future Sandbox writes

Each row runs later, in Integrate or Test, only after its own preview and approval. Charge rows here are Integrate's. Test reuses the accounts, customers, and paykeys these rows create, by exact external ID, but makes its own charges with fresh external IDs and keys for every run, as Test's [preview step](../../straddle-test/steps/03-preview.md) says. A charge or payout row takes the full token from the paykey create row's `data.paykey`. Add a `revealPaykey` or `getUnmaskedPaykey` row only for an existing paykey whose token the app didn't keep. It is one of the fourteen, so it names the SDK or CLI.

| Order | Operation | Executing tool | Account | External ID | Idempotency key source |
| --- | --- | --- | --- | --- | --- |
| | | SDK method / CLI command / permitted MCP operation | | | |

## Verification

- Repository tests and the test command:
- Retry with the same idempotency key:
- Two-account proof (SaaS and marketplace):
- Notification proof (one signed event received, duplicate ignored):
- Payout handlers, refund payouts included (`paid`, `failed`, `reversed`): offline, fed recorded `payout.event.v1` payloads, because Sandbox payouts haven't been observed reaching `paid`.

Sandbox scenarios: the rows of the scenario matrix in the best-practices `sandbox-outcomes.md` (What your app must handle) for each lifecycle this plan covers.

| Scenario | Create with | Must observe through the notification path | Proves |
| --- | --- | --- | --- |
| Happy path | customer `verified`, paykey `active`, charge `paid` | `paid` | Fulfillment |
| Return after paid | charge `reversed_insufficient_funds`, with Test's timed funding sweep row | `paid`, then `reversed` with R01 | Clawback after fulfillment |

## Unresolved decisions

- None yet. Each open item names Plan's recommended answer and whether it blocks implementation.

## Approval boundaries

- Approving this plan permits only the file changes listed above.
- Existing provider code stays unless a separate migration plan authorizes it.
- Every Sandbox write needs its own preview and approval at the time it runs.
- The fourteen excluded operations run only through the SDK or the Straddle CLI.
