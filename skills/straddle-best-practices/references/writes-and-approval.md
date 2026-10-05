# Writes, idempotency, and approval

## The fourteen operations that never use `execute-request`

The hosted API MCP's `execute-request` can reach every operation a key allows. Scalar marks these fourteen as non-executable but does not enforce the flag, so route them through the released SDK or the Straddle CLI.

| Operation ID | Request |
| --- | --- |
| `createCustomer` | `POST /v1/customers` |
| `createBankAccountPaykey` | `POST /v1/bridge/bank_account` |
| `createPlaidPaykey` | `POST /v1/bridge/plaid` |
| `createQuilttPaykey` | `POST /v1/bridge/quiltt` |
| `createCharge` | `POST /v1/charges` |
| `createPayout` | `POST /v1/payouts` |
| `deleteCustomer` | `DELETE /v1/customers/{id}` |
| `getUnmaskedCustomer` | `GET /v1/customers/{id}/unmasked` |
| `getUnmaskedPaykey` | `GET /v1/paykeys/{id}/unmasked` |
| `getUnmaskedCharge` | `GET /v1/charges/{id}/unmask` |
| `getUnmaskedPayout` | `GET /v1/payouts/{id}/unmask` |
| `getUnmaskedRepresentative` | `GET /v1/representatives/{representative_id}/unmask` |
| `getUnmaskedLinkedBankAccount` | `GET /v1/linked_bank_accounts/{linked_bank_account_id}/unmask` |
| `revealPaykey` | `GET /v1/paykeys/{id}/reveal` |

Any `DELETE` added to the public contract later joins this list.

## Public contract only

Use only operations published in the public API contract (1.0.4). An operation outside it, or one whose contract or account scope you cannot confirm, is not run at all: not through `execute-request`, the SDK, or the CLI, even when a CLI command or SDK method exists for it. Stop, say so, and resolve it against the public contract before planning or running anything.

## Preview and approval

Before any remote write, show the developer:

- the environment (Sandbox for integration work) and the base URL it resolves to
- the integration type and acting account, or that the header is omitted and why
- each operation, the executing tool (SDK method, CLI command, or a permitted MCP operation), and a payload summary without secrets
- the idempotency key and external ID for each create

Proceed only after an explicit yes. A changed environment, account, operation, or payload needs a new approval. A denial means no request is sent.

Ask for one-time approval: a yes covers this preview's calls and nothing later. When the client's own permission prompt for the command also offers a standing grant, such as Codex's "don't ask again for commands that start with …", which saves a rule in `~/.codex/rules/default.rules` for later sessions, ask the developer to approve once instead. Record which kind the writes ran under: `one-time`, or `standing` with the client and where it saved the rule.

The client's native permission prompt can be the approval, so the developer answers once, only when it is exactly equivalent to the approval question. That means all of these hold:

- The complete preview was shown first, and nothing in it has changed since: environment, base URL, acting account, operations, payloads, and literal idempotency keys.
- The prompt shows the same Sandbox actions the preview lists, and the developer gives a one-time yes to it.

Otherwise ask the approval question separately, even when the client also prompts. A generic "Allow this command" prompt that doesn't show those actions, such as one for a script that runs SDK calls, never stands in. Neither does a standing grant or an earlier allow rule. Never suppress, bypass, or pre-approve the client's own checks to save a question. Any change to the context or the payload needs a new approval. Record which surface gave the yes: `chat`, or `native prompt` with the client.

## Idempotency

- Send an idempotency key on every create. The contract allows 10 to 40 characters. Derive it deterministically from the logical request: a retry of the same request reuses its key, and each distinct write, including each deliberate resubmit attempt, gets its own. Concatenating an operation name with a raw ID can exceed 40 characters. Use a short operation prefix plus a fixed-length hash of the request's identity instead, for example `chg-` plus the first 32 hex characters of SHA-256 of the charge's external ID. Never truncate a raw ID to fit, because truncated IDs can collide.
- Give every created resource a stable, non-sensitive external ID.
- Use IDs returned by successful create responses in the next step's ID fields. Do not rediscover them with list calls.
- A charge's or payout's `paykey` field takes the full paykey token, not the paykey `id` or a masked `paykey`. A paykey create returns the full token in `data.paykey`: pass that value to the charge or payout, and store it encrypted. Get and list responses mask it. For an existing paykey whose token you didn't keep, `revealPaykey` or `getUnmaskedPaykey` returns it. Both are among the fourteen, so use the SDK or CLI after their own approval. Use the token within one SDK process or one CLI command without printing it. Never write it to a plan, preview, log, report, test, evidence, or commit. Follow the contract field, not the value's shape.
- If a create result is unknown (timeout, dropped connection), retry with the same idempotency key or look up the exact external ID. Never loop on fresh creates.
- After a validation `400`, send the corrected request with a new idempotency key. The rejected request still used up its key, so resending that key, even with the fixed payload, returns `409`. The API does this by design. Derive the new key from the corrected attempt, for example the hash of `<external ID>:fix-1`, and show the corrected request in a new preview for approval.

## Payment dates

- `payment_date` on a charge or payout is a calendar date (`YYYY-MM-DD`) in US Eastern time (`America/New_York`). Compute it in that zone, never from the UTC date or the machine's local zone.
- Today's Eastern date originates immediately. A later date holds the payment as `scheduled` until that date. An earlier date is rejected with `422`.
- Between midnight UTC and midnight Eastern, the UTC date is already tomorrow's Eastern date. A `payment_date` taken from UTC then holds the payment for a day instead of originating it.
- Timestamps in API responses, such as `created_at` and `status_details.changed_at`, are UTC. Compare them in UTC, and convert to Eastern only to derive a `payment_date`.

## CLI writes

- Run `--dry-run` first and show its output as the preview. From CLI v1.0.4 the dry run prints the `Idempotency-Key` header it would send; check it matches the key in the preview. CLI v1.0.3 does not print it, so list the key in the preview yourself either way.
- Pass `--idempotency-key <key>` on every create. It sends the `Idempotency-Key` header. `--idempotent` is not a substitute: it only treats an already-existing result as a no-op and sends no key. `--idempotency-key` first appears in CLI v1.0.3. If the installed CLI's `--help` for that create does not list it, do not run the create through the CLI; use the SDK's idempotency option instead.
- Add `--agent` for JSON output and non-interactive mode.
- Pass IDs from one response straight into the next command. Do not write tool JSON to temporary files or pipe it through `jq`.
