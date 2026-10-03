# Audit checks

Run these over application code. Each is a hypothesis generator; step 4 confirms or dismisses every hit against the installed SDK and the contract. SDK notes were checked against `@straddlecom/straddle` 1.0.4 as published on npm and must be re-checked in the installed version.

## Safety

| ID | Look for | Hypothesis | Triage against | Recovery |
| --- | --- | --- | --- | --- |
| S1 | A key literal, `sk_` or `Bearer` token strings, or a key variable in client-side code | Key exposed in source or browser bundle | Build config, which bundle the file ships in | Move to server-side secret; rotate the key in the dashboard |
| S2 | Straddle client construction without a key check, or `?? ''` / empty-string fallbacks | Missing key silently becomes an unauthenticated request or a no-op | SDK client constructor (TypeScript throws when `bearer`/`BEARER` is empty) | Fail with a configuration error that names the variable |
| S3 | Base URL or environment absent from configuration | The deployment targets whatever the SDK defaults to rather than the intended environment. Keys are environment-scoped, so a production key sent to the Sandbox default fails authentication (a 401 that looks like a bad key) | SDK default base URL (TypeScript defaults to Sandbox when `baseURL` and `STRADDLE_BASE_URL` are unset) | Explicit environment configuration, validated at startup with a configuration error when absent |
| S4 | `execute-request` in scripts, agent configs, or prompts for the fourteen SDK/CLI-only operations | Excluded operation routed through the MCP | [writes-and-approval](../../straddle-best-practices/references/writes-and-approval.md) list | Route through the SDK or CLI with preview and approval |
| S5 | Logging of request/response bodies, unmask or reveal results | Unmasked data or secrets in logs | Which fields the operation returns in the contract | Log IDs and `Request-Id` only |

## Account scope

| ID | Look for | Hypothesis | Triage against | Recovery |
| --- | --- | --- | --- | --- |
| A1 | `Straddle-Account-Id` sent in a direct integration | Header on a direct account | Integration model from the developer or CLI | Remove the parameter |
| A2 | SaaS customer/paykey/charge/payout calls without the account parameter | Missing required scope; request fails or acts on the wrong account | SDK resource source: how the method accepts the account (TypeScript takes `'Straddle-Account-Id'` in the call params) | Pass the selected account; fail locally when absent |
| A3 | Marketplace customer, paykey, or Bridge calls that send the account | Platform-owned resource sent with a seller scope | [account scope](../../straddle-best-practices/references/account-scope.md) | Omit the header on those calls |
| A4 | Marketplace charge or payout without the seller account | Seller attribution missing | Same | Pass the seller's embedded account |
| A5 | Account chosen by list-and-pick-first, fuzzy name match, or a stale global | Ambiguous or leaked acting account | Resolution code path | Resolve by Straddle ID or exact unique external ID; reject ambiguity |

## Notifications

Anti-patterns to flag in notification code. Each row is something the audit detects and reports, never something to write:

| ID | Look for | Hypothesis | Triage against | Recovery |
| --- | --- | --- | --- | --- |
| N1 | A loop, interval, cron, or retry around `charges.retrieve`, `payouts.retrieve`, list calls, `GET /v1/charges/{id}`, or `straddle tail` to detect status | Ordinary API polling instead of a notification endpoint; misses `paid` before `reversed` | Contract `webhooks` section for the event | Consume a webhook, FIFO, or polling endpoint |
| N2 | Webhook handler that parses JSON before verification, or uses a body-parser before the route | Signature computed over re-serialized body | [receiving-webhooks.md](../../straddle-best-practices/references/receiving-webhooks.md) | Verify the raw body |
| N3 | `webhooks.unwrap(body, { key })` or any call without request headers | Verification skipped | Installed SDK `webhooks` source (TypeScript 1.0.4 verifies only when `headers` is passed) | Pass the request's three `webhook-*` headers; on FIFO, switch to the `svix` library |
| N4 | Missing or empty signing secret treated as "skip" | Unverified events accepted | Handler code and SDK helper | Fail with a configuration error |
| N5 | `2xx` returned before the event is persisted, or no dedupe on `webhook-id`/`event_id` | Lost or double-processed events | Handler code | Persist then acknowledge; dedupe on the ID |
| N6 | Platform handler ignoring `account_id` | Events applied to the wrong account | Event schema in the contract | Route on `account_id`, reject unknown accounts |
| N7 | Code or docs treating Dashboard email as the status source | Human confirmation used as a notification model | n/a | Use a notification endpoint; keep email for people |
| N8 | FIFO handler that parses the body as one event (for example reads `event_type` from the parsed body), verifies only `webhook-*` headers (including through an SDK `unwrap` or `Parsed` helper or `standardwebhooks`), or reuses the webhook handler unchanged | Every batch is rejected, and the endpoint blocks every later event | [Endpoint types](../../straddle-best-practices/references/receiving-webhooks.md#endpoint-types), [Verification library](../../straddle-best-practices/references/receiving-webhooks.md#verification-library), and the endpoint's transformation | Verify with the `svix` library, which reads the `svix-*` headers, parse the transformation's output, store the whole batch in order, drop duplicates by `event_id`, then `2xx` |
| N9 | Polling consumer that never commits the last offset, or retries a `423` | Every later poll returns `423` and no new events arrive | Same | Commit the last offset after storing each batch |

## SDK drift

| ID | Look for | Hypothesis | Triage against | Recovery |
| --- | --- | --- | --- | --- |
| K1 | `github.com/straddleio/straddle-go`, Python `straddle` 0.x, or other Stainless-era packages | Retired SDK | Lockfile | Move to the published Scalar SDK; Go module path changed to `github.com/straddle-build/straddle-go` |
| K2 | Method, parameter, or type names that do not exist in the installed SDK | Code written against another version or from memory | Installed SDK `api.md` and resource source | Use the installed signature |
| K3 | Creates without an idempotency key or external ID | Duplicate resources on retry | SDK create params (TypeScript takes `'Idempotency-Key'` in params) | Derive a stable key from the intent |
| K4 | Unbounded retry of a create after a timeout | Duplicate charges or payouts | Retry code | Retry with the same key, or look up the exact external ID |

## Contract drift

| ID | Look for | Hypothesis | Triage against | Recovery |
| --- | --- | --- | --- | --- |
| C1 | Hand-built HTTP requests to `straddle.com` | Paths, fields, or headers drift from the contract | Contract operation | Use the SDK method |
| C2 | Status or event-type strings not in the contract | Handler never matches, or matches the wrong state | Contract enums and `webhooks` | Use contract values |
| C3 | `config.sandbox_outcome` outside tests | Sandbox control in a production path | Contract field description | Gate to tests |
| C4 | Calls to operations absent from the public contract (for example CLI commands or paths annotated internal), through any route | Code depends on an operation outside the public contract | Public contract operation list | Stop and resolve against the public contract; replace with a public operation or remove the dependency with the developer's approval |
