# Execution routes

Where each Sandbox write and each excluded read runs. The rules behind this table are in [writes-and-approval.md](../../straddle-best-practices/references/writes-and-approval.md) and [account-scope.md](../../straddle-best-practices/references/account-scope.md). This page only says which tool carries out each operation.

Names below were checked against the installed TypeScript SDK `@straddlecom/straddle` 1.0.4 (`api.md`) and the Straddle CLI command tree. Confirm each one in the developer's installed SDK or with `straddle <command> --help` before using it. For Python, Ruby, C#, or Go, read the installed package for the equivalent method rather than translating the TypeScript name; the Python package is `straddle` from PyPI, at the version in the Current versions table.

## The fourteen excluded operations: SDK or CLI only

| Operation ID | TypeScript SDK | Straddle CLI |
| --- | --- | --- |
| `createCustomer` | `client.customers.create` | `straddle customers create` |
| `createBankAccountPaykey` | `client.bridge.createBankAccountPaykey` | `straddle bridge create-bank-account-paykey` |
| `createPlaidPaykey` | `client.bridge.createPlaidPaykey` | `straddle bridge create-plaid-paykey` |
| `createQuilttPaykey` | `client.bridge.createQuilttPaykey` | `straddle bridge create` (Quiltt token) |
| `createCharge` | `client.charges.create` | `straddle charges create` |
| `createPayout` | `client.payouts.create` | `straddle payouts create` |
| `deleteCustomer` | `client.customers.delete` | `straddle customers delete <id>` |
| `getUnmaskedCustomer` | `client.customers.listUnmasked` | `straddle customers unmasked get-customer` |
| `getUnmaskedPaykey` | `client.paykeys.listUnmasked` | `straddle paykeys unmasked get-paykey` |
| `getUnmaskedCharge` | `client.charges.listUnmasked` | `straddle charges unmask charges-v1-get` |
| `getUnmaskedPayout` | `client.payouts.listUnmasked` | `straddle payouts unmask payouts-v1-get` |
| `getUnmaskedRepresentative` | `client.representatives.listUnmasked` | `straddle representatives unmask get` |
| `getUnmaskedLinkedBankAccount` | `client.linkedBankAccounts.listUnmasked` | `straddle linked-bank-accounts unmask get-linked-bank-account-unmasked` |
| `revealPaykey` | `client.paykeys.reveal` | `straddle paykeys reveal get` |

The six unmask operations and paykey reveal return unmasked personal or bank data. Run them only when the approved plan needs them, for example to recover the token of an existing paykey the app didn't keep. Keep their output out of logs, plans, and evidence, and record only that the call succeeded and which ID it read.

## Operations outside the public contract

Run only operations in the public API contract, as [writes-and-approval.md](../../straddle-best-practices/references/writes-and-approval.md) requires. The CLI's command tree also includes internal commands outside that contract, and the existence of a command or SDK method is not evidence that its operation is public. When you cannot place an operation in the public contract and its account scope, stop before any preview.

## Paykey tokens for charges and payouts

Follow the contract's field meanings, and never guess a value's kind from its shape. In API contract 1.0.4, a charge's or payout's `paykey` request field is "the paykey token that identifies the customer's bank account". It is not the paykey's resource `id`.

A Bridge paykey create returns the full token in `data.paykey`. `GET /v1/paykeys/{id}` and list responses return it masked. In the TypeScript SDK 1.0.4, the shared `Paykey` type that the create returns documents `paykey` as "Masked paykey value". That comment is wrong for a create response. Follow the contract, and add no reveal row or reveal fallback for a paykey created earlier in the same run.

- **ID fields take IDs.** Fields such as `customer_id` and `organization_id`, and the ID in a path like `/v1/paykeys/{id}/reveal`, take `data.id` from the earlier create response.
- **The payment `paykey` field takes the full token.** For a paykey created earlier in the same run, pass the create response's `data.paykey`, never its `data.id`. No reveal is needed. For an existing paykey whose token the app didn't keep, get the token with `revealPaykey` or `getUnmaskedPaykey`. Both are excluded operations, so they run through the SDK or CLI only, as their own preview rows with approval. Never pass the paykey's `id` or a masked value.
- **Keep the token out of the record.** Never print, log, or write a full token into a plan, preview, report, evidence file, test, or commit. Take it from the response that returned it and use it in one step: in a single SDK process that does not print it, or in a single CLI command that passes it to the payment without printing it (check the CLI's output flags with `--help` first). The preview names the row the token comes from and the payment row that uses it, never the token. Payment responses return the paykey masked, so record the payment ID only.

## Other writes the fixture uses: SDK or CLI

Integrate and Test create fixture organizations and accounts through the SDK or CLI after the preview is approved, like every other fixture write. They do not use the API MCP for these. That rule covers this workflow only. Outside it, these remain permitted MCP operations, subject to the usual preview and approval.

| Operation | TypeScript SDK | Straddle CLI |
| --- | --- | --- |
| Create organization (`POST /v1/organizations`) | `client.organizations.create` | `straddle organizations create` |
| Create account (`POST /v1/accounts`) | `client.accounts.create` | `straddle accounts create` |

Webhook, FIFO, and polling endpoints are created in the Straddle dashboard by the developer, not by Integrate.

## Permitted API MCP reads

Use `execute-request` for independent verification reads that are not on the excluded list, such as `GET /v1/accounts/{account_id}`, `GET /v1/customers/{id}`, `GET /v1/charges/{id}` (read once, never in a loop), or exact external-ID lookups with `external_id` on `GET /v1/organizations`, `GET /v1/accounts`, `GET /v1/customers`, or `GET /v1/payments` (charges and payouts). Pass the acting account explicitly when the operation takes one, because the hosted MCP does not inherit CLI context. A successful call proves the caller's key works for that read. It proves nothing about the fourteen exclusions, which Scalar does not enforce.

## Idempotency by route

The contract requires an `Idempotency-Key` of 10 to 40 characters. The API answers `400` for a key outside that range, and `409` when a key is reused for a different request. Derive each key deterministically from the operation and the external ID, so a retry of the same request reuses the same key and two different requests never share one. A corrected request after a validation `400` is a different request and needs a new key, as [writes-and-approval.md](../../straddle-best-practices/references/writes-and-approval.md#idempotency) says. When the plain form (for example `chg-order-a-0001`) would exceed 40 characters, keep a short operation prefix and replace the external ID with a stable digest of it, such as the first 24 hex characters of its SHA-256. Check the length before the preview, never by trial against the API.

- **SDK.** Pass `Idempotency-Key` in the create params, derived as above, for example `chg-order-a-0001`.
- **CLI.** Pass `--idempotency-key <key>` on every create. It first appears in CLI v1.0.3, so check the create's `--help`. When the installed CLI does not list it, run that create through the SDK instead. `--idempotent` is not a substitute: it treats an already-existing result as success and sends no key. The preview states the key you will pass. From CLI v1.0.4 `--dry-run` also prints the `Idempotency-Key` header; check it matches the preview's key, but never take the key from the dry run.

## Configuration checks by route

Neither tool reliably refuses a missing key for you, so check before calling either one.

- The CLI sends a request even when no credential is configured, and `straddle doctor` sends `GET /` before it checks auth. Integrate runs the offline checks in [step 1](../steps/01-begin.md) first and does not run a live CLI command until they pass.
- The TypeScript and Python SDKs read `BEARER`, not `STRADDLE_API_KEY`, when no `bearer` option is given, and both default to the Sandbox base URL. Application code passes `bearer` from `STRADDLE_API_KEY` explicitly and resolves the base URL from an explicit environment, and it throws a configuration error when either is missing.
