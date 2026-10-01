# Readiness checklist

Every row is required unless it says otherwise. SDK facts below were checked against `@straddlecom/straddle` 1.0.4 as published on npm; confirm them in the installed version before relying on them.

## Code

| Row | Pass when |
| --- | --- |
| Key from server-side configuration | The key is read from server environment or a secret manager. It is not in source, tests, fixtures, or any browser bundle. |
| Missing key fails | Startup or the first Straddle call raises a configuration error naming the key. It does not fall back, skip, or return empty. The TypeScript SDK throws when its `bearer` option and `BEARER` variable are both empty; code that maps `STRADDLE_API_KEY` must keep that failure. |
| Environment explicit | The production base URL (`https://production.straddle.com`) comes from explicit configuration. The TypeScript SDK falls back to Sandbox when `baseURL` and `STRADDLE_BASE_URL` are unset, so relying on its default is a fail for production. |
| No Sandbox-only inputs in production paths | `config.sandbox_outcome` and Sandbox test bank data appear only in test code or Sandbox-gated branches. |
| Account scope | Matches the integration model per [account scope](../../straddle-best-practices/references/account-scope.md): no header for direct; selected account where required for SaaS and marketplace; header omitted on marketplace customer, paykey, and Bridge calls and on organization and account operations. Missing required scope fails before a request. |
| Idempotent creates | Every customer, paykey, charge, and payout create sends an idempotency key derived from the intent and a stable external ID. |
| Ambiguous-result recovery | A timeout or dropped response on a create retries with the same idempotency key or looks up the exact external ID. No unbounded create retry. |
| Fourteen operations | No script, agent configuration, or code path sends the fourteen SDK/CLI-only operations through `execute-request`. |
| Public contract only | Every Straddle operation the code, scripts, or agent configuration uses is in the public API contract. Nothing calls an internal or unknown operation by SDK, CLI, or MCP. |
| Notification path | One of webhook endpoint, FIFO endpoint, or polling endpoint is implemented. No loop on resource reads (`charges.retrieve`, `GET /v1/charges/{id}`, list calls) or `straddle tail` discovers status. |
| Notification handling | Per [Endpoint types](../../straddle-best-practices/references/receiving-webhooks.md#endpoint-types) and [Verification library](../../straddle-best-practices/references/receiving-webhooks.md#verification-library) for the implemented type. Webhook: raw body, verified signature with headers passed, missing secret fails, `2xx` only after persisting, duplicates are no-ops. FIFO: verified against `svix-*` headers with the `svix` library (never an SDK `unwrap` or `Parsed` helper); parser matches the production endpoint's transformation output; each batch is stored whole and in order before `2xx`, with duplicates dropped by `event_id`. Polling: the last offset is committed after each batch is stored. |
| Platform event routing | SaaS and marketplace handlers route on the event's `account_id` and reject accounts the platform does not own. |
| Logs | No key, signing secret, or unmasked customer or bank data is logged. `Request-Id` or `Correlation-Id` is logged for support. |

## Sandbox evidence

| Row | Pass when |
| --- | --- |
| Paid charge | A charge created by this code with `sandbox_outcome: paid` reached `paid`, observed through the notification path. |
| Reversal | A charge with `sandbox_outcome: reversed_insufficient_funds` was observed going `paid` then `reversed` with `R01`, through the notification path, ordered as [Ordering status changes](../../straddle-best-practices/references/receiving-webhooks.md#ordering-status-changes) says. In Sandbox this needs the timed funding sweep in Test's [step 4](../../straddle-test/steps/04-sandbox.md#funding-sweep-for-the-return): without it the charge ends `failed` with no `paid`, which leaves this row unproven. That sweep is a Sandbox test recipe, observed in Sandbox and not a documented API contract, so production code never depends on it. |
| Missing scope | For SaaS and marketplace, a create without a required account failed locally with zero requests sent. |
| Two accounts | For SaaS and marketplace, requests for account A and account B each carried the right account, and header-omitted operations stayed omitted. |
| Duplicate delivery | A repeated delivery with the same `webhook-id` or `event_id` changed nothing. |

## Production setup (developer confirms)

| Row | Pass when |
| --- | --- |
| Production key | Issued in the production dashboard and stored in the deployment's secret manager. |
| Production endpoint | A production webhook, FIFO, or polling endpoint exists, subscribed to the events the code handles, with its own signing secret or polling token stored server-side. |
| Endpoint failure alerts | Failure notifications are configured so an auto-disabled endpoint is noticed. |
| Customer-facing onboarding (platforms) | Production uses the intended customer-facing onboarding path, not the Sandbox API bootstrap used in tests. |
| Human confirmation channel | Dashboard email recipients are set. This is optional and is never the notification path for code. |
