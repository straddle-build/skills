---
name: straddle-best-practices
description: Shared rules for every Straddle integration task. Use whenever you plan, build, test, review, or debug code that touches the Straddle API, Straddle SDKs, the Straddle CLI, the Straddle API MCP or Docs MCP, Straddle-Account-Id, Pay by Bank, Bridge, paykeys, charges, payouts, webhooks, or sandbox testing, or when a developer asks how a charge or payout behaves, such as its statuses, when it can be cancelled or updated, and whether paid is final, even when the user does not mention best practices. It answers questions and carries out no Straddle operation itself: a request to run, preview, or implement Straddle operations, such as creating, charging, revealing, unmasking, or deleting through an MCP, the SDK, or the CLI, belongs to straddle-integrate, and a request to audit an existing integration belongs to straddle-audit. Other Straddle skills cite this one instead of restating it.
metadata:
  version: 0.1.0
---

# Straddle best practices

These rules apply to every Straddle integration and to every Straddle skill. Read the linked reference before you answer a question in its area or write code that depends on it.

Every Straddle skill also follows [voice.md](references/voice.md) for developer-facing replies, [show-me.md](references/show-me.md) for visuals, and [wizard-program.md](references/wizard-program.md) when the Straddle Wizard runs the skills in one session.

## Current versions

| Surface | Released version | Notes |
| --- | --- | --- |
| API contract | 1.0.4 (`@straddle/straddle-api@1.0.4`) | Canonical Scalar Registry release. |
| TypeScript SDK | `@straddlecom/straddle` 1.0.4 | npm. |
| Ruby SDK | `straddle` 1.0.4 | RubyGems. |
| C# SDK | `Straddle` 1.0.4 | NuGet. |
| Go SDK | `github.com/straddle-build/straddle-go` v1.0.4 | |
| Python SDK | `straddle` 1.0.5 | PyPI. |
| Straddle CLI | v1.0.3 published | v1.0.3 adds `--idempotency-key` on creates and `runtime_context` in `agent-context` and `doctor`. Check `straddle --version` and the command's `--help` before relying on either. |

Versions change. Check the installed package in the developer's dependency tree before you rely on a method name, and prefer the SDK release's own `api.md`, README, and generated skill over memory.

## Rules

1. **Environment and credentials.** Read the API key from the process environment (`STRADDLE_API_KEY`). Never open `.env*` files, credential stores, or CLI config files, or suggest commands that do, and never print, echo, log, or commit a key or any part of it. A missing key or environment is a configuration error before any request, never a silent no-op. See [environments-and-credentials.md](references/environments-and-credentials.md).
2. **Account scope.** `Straddle-Account-Id` depends on the integration type and the operation. Direct integrations never send it. Marketplace customer, paykey, and Bridge calls omit it, while SaaS customer, paykey, and Bridge creation require it. On SaaS and marketplace, creating a charge or payout (and refund, resubmit, or authorization upload) requires an explicitly selected account; other charge and payout reads and updates send the account when one is selected. See [account-scope.md](references/account-scope.md).
3. **Creates are idempotent.** Send an idempotency key on every create and give resources stable external IDs. After an ambiguous result, recover with the same key or an exact external-ID lookup, not a fresh create. See [writes-and-approval.md](references/writes-and-approval.md).
4. **Fourteen operations never use `execute-request`.** Charge, payout, and customer creation, the three paykey-creation endpoints, every `DELETE`, the six unmask operations, and paykey reveal run through the released SDK or the Straddle CLI, after a preview and explicit approval. Scalar does not enforce this, so you must. Operations outside the public API contract are not run by any tool. See [writes-and-approval.md](references/writes-and-approval.md).
5. **Writes need a preview and approval.** Show environment, acting account, operation, payload summary, and idempotency key before any remote write. A changed target or payload needs a new approval. Integration work uses Sandbox.
6. **Notifications.** Use a webhook endpoint by default, and a FIFO or polling endpoint only in the cases [notifications.md](references/notifications.md) names. Never loop on ordinary resource reads such as `GET /v1/charges/{id}` to discover status. Dashboard email is a human confirmation, not a notification model. For any handler, see [receiving-webhooks.md](references/receiving-webhooks.md).
7. **Tools.** Use the Docs MCP for documentation, the SDK for application code, and the CLI for diagnostics and approved sandbox helpers. If the Docs MCP lists `execute-request` or other API tools, never call them, and tell the developer it is exposing execution. The API MCP can run permitted operations, including reads and approved writes outside the fourteen, under rule 5. A skill may narrow this further, as Setup and Plan do. See [tools.md](references/tools.md).

## Product model

Read the reference for each flow before you plan, build, or test it: [charges](references/charges.md), [payouts](references/payouts.md), [returns and disputes](references/returns-and-disputes.md), [refunds and resubmits](references/refunds-and-resubmits.md), [customers and identity](references/customers-identity.md), [Bridge and paykeys](references/bridge-and-paykeys.md), [funding and reconciliation](references/funding-and-reconciliation.md), [webhook events](references/webhooks.md), [platforms](references/platforms.md), [ACH timing and consent](references/ach-timing-and-consent.md), [errors and limits](references/errors-and-limits.md), and the [Sandbox outcomes](references/sandbox-outcomes.md) that exercise them. Each says what the object is, its contract-checked states, what your app must handle, and its events.

## Deprecated paths

- The `docs.straddle.com/.well-known/skills` index. It recommends polling charge reads and is retiring.
- Any MCP server other than the hosted Scalar API MCP and Docs MCP in [tools.md](references/tools.md). Use only the hosted Scalar servers.
- The React embed wrapper. Hosted iframe onboarding is the supported path until Onboarding V2.

## When a rule blocks the task

Stop and say which rule applies and why. Check the whole request against every rule above, not only the first one that stops it, and do not work around a rule silently.

- **Missing configuration blocks every request.** When missing configuration blocks only a request the current skill marks optional, such as Audit's read, skip that request, report the configuration error and that zero Straddle API requests were sent, and finish the rest of the task without Straddle requests, including any report the skill writes. When rule 1 stops the task before any Straddle request was sent, name what is missing and say that zero Straddle API requests were sent. Then say what the developer does to clear it and which check you'll rerun once they have; that is the reply's next step. You may name what comes after the fix, such as the decisions still to make, but don't start it: no repository read, facts table, or plan, and don't ask those decisions now. The requested operations the next bullet lists and any report the step requires still appear. When an unconfigured route stops later in the run after already-approved requests ran on another route, name what is missing, report the actual earlier operations and results, stop all new requests on the unconfigured route, and never imply rollback or a false zero. Offer no Straddle API request, not even a permitted read, until the developer has set it. For any write or any of the fourteen operations, Sandbox is the only environment to ask for (rule 5); do not offer Production as a choice.
- **Name the other rules the request hits in the same reply.** List each requested operation that did not run. Any of the fourteen operations the developer asked for goes only through the SDK or CLI after a preview and approval (rule 4), never through `execute-request`, even once the configuration is fixed. That classifies the route; it isn't an offer to send. Promise or offer a requested operation only when the configuration is confirmed and the current skill's scope allows it. When the scope doesn't, say this skill doesn't send it by any route.
- **Otherwise offer the supported alternative**, for example an SDK call instead of `execute-request`, or a polling endpoint instead of a status loop.
