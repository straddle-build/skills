# Step 4: Preview and approval

- **Needs:** summaries from steps 1 to 3, and the plan's future Sandbox writes table.
- **Tools:** Read, including [show-me.md](../../straddle-best-practices/references/show-me.md); AskUserQuestion; Bash only for `straddle ... --dry-run --agent` and `--help`, and only when step 1 recorded **configured**, and for `date -u +%Y-%m-%dT%H:%M:%SZ` to record the approval time. No live request.
- **Next:** [05-execute.md](05-execute.md) after an explicit yes. Otherwise [06-review.md](06-review.md), then the handoff with the status below.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-integrate","step":"04-preview"}
```

When the plan has no Sandbox writes, say so and go to step 6.

When step 1 recorded a **configuration error**, including an offline synthetic localhost target with any condition not yet confirmed, such as the sandboxed session, build no preview, run no dry run, and do not ask for approval. Give the short blocked report described under [Markers](../SKILL.md#markers), ask only for the missing confirmation, and say that no Straddle request will be sent until the named values are set in the developer's own shell. Then print `STRADDLE_ABORT` with `configuration error: <what is missing>`, continue at step 6, and hand off with `blocked`, never `awaiting_approval`. The full preview below is built only once step 1 records **configured**.

## Build the preview

List every intended write in execution order, including every organization and account to reuse or create, and every excluded read (unmask or reveal) the plan needs. Write exact values, not placeholders, except for IDs that only a previous create in this run can return. Name those by the row they come from.

```markdown
## Straddle Sandbox preview

- Environment: sandbox, https://sandbox.straddle.com
- Target: Straddle Sandbox | offline synthetic localhost (not Straddle Sandbox) <exact base URL>
- Integration type: <direct | saas | marketplace>
- Configuration: environment <explicit sandbox | unset | other>; credential per route: SDK `STRADDLE_API_KEY` <present | missing>, CLI `auth status` <env | saved | none>, API MCP <developer-confirmed | unknown>

| # | Operation | Executing tool | Acting account (Straddle-Account-Id) | Payload summary | External ID | Idempotency key | If it exists |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | POST /v1/organizations | SDK `client.organizations.create` | omitted (organization operation) | name | acme-kit-r1-org | org-acme-kit-r1-org | reuse exact match |
| 2 | POST /v1/accounts (A) | SDK `client.accounts.create` | omitted | organization_id = #1 data.id | acme-kit-r1-acct-a | acct-acme-kit-r1-acct-a | reuse exact match |

Account A/B test: <which rows run as A and which as B, and which rows must omit the header>.
Verification reads (no approval needed): <permitted API MCP or SDK reads, each run once>.
Not included: <writes the plan lists that this run will not make, and why>.
```

Rules for the table:

- **Executing tool.** Use the SDK method or CLI command from [execution-routes.md](../references/execution-routes.md), verified in step 2. The fourteen excluded operations always show the SDK or CLI, never `execute-request`, including when the developer asks for the MCP. Say why in one line.
- **Acting account.** Show the account ID and how it was resolved (Straddle ID or exact external ID), or `omitted` with the rule that omits it. Direct integrations never send it.
- **Idempotency key.** Write the key you will pass on every create. It must be 10 to 40 characters and derived as in [Idempotency by route](../references/execution-routes.md#idempotency-by-route). A CLI row is allowed only when the installed CLI lists `--idempotency-key` for that create. Otherwise the row uses the SDK. Never infer the key from `--dry-run` output, because the dry run does not print it.
- **Paykey tokens.** A charge or payout row that uses a paykey from a Bridge `bank_account` or `plaid` create depends on a `revealPaykey` or `getUnmaskedPaykey` row, which is itself an excluded operation (SDK or CLI) needing approval. Name that row, never the token. See [Paykey tokens for charges and payouts](../references/execution-routes.md#paykey-tokens-for-charges-and-payouts).
- **Sandbox outcomes.** Include the `config.sandbox_outcome` values the plan tests, such as `verified`, `active`, `paid`, and `reversed_insufficient_funds`.
- **Payload.** Use synthetic, non-sensitive data. No real names, bank numbers, or keys.
- **Offline synthetic target.** When step 1 recorded one, write the exact localhost base URL in place of the Sandbox URL, and list no API MCP verification reads, per [offline-synthetic-target.md](../references/offline-synthetic-target.md). An approval covers that target only. Switching between it and Straddle Sandbox changes the target and needs a new preview.

When step 1 recorded **configured** and a row uses the CLI, run it with `--dry-run --agent` and show the result under the table. A dry run is not a substitute for the preview.

Beside the table, show the rows as one small visual, following [show-me.md](../../straddle-best-practices/references/show-me.md), inline in your reply; write no file. It shows which returned ID feeds which row, and which account each row runs as, by the table's row numbers. It names only operations, accounts, external IDs and values that are in the table, in the table's numbering, and adds nothing the table doesn't say. The developer approves the table.

## Ask for approval

The reply that asks for approval is one message with these three parts, in this order, even when you showed some of them earlier in the session:

1. The whole preview from [Build the preview](#build-the-preview): its header lines, the full table with every row and all eight columns, any dry-run output, and the lines under it. Never a shortened table, a summary, or a pointer to an earlier message.
2. The one visual described above, right after the table.
3. The approval question. Frame it in a plain sentence or two in the [Straddle voice](../../straddle-best-practices/references/voice.md), such as "Here's what I'll send to Sandbox. Nothing runs until you say yes." Then ask one question: approve these exact rows, yes or no.

Ask for a one-time yes, not a standing grant, and record which kind was given, as [Preview and approval](../../straddle-best-practices/references/writes-and-approval.md#preview-and-approval) says. Right after a yes, run the `date` command above and record its output as the approval time.

Only a yes given after this exact preview counts. These do not count:

- an approval given before the preview was shown, or a general "go ahead" in the original request
- an approval of an earlier preview whose environment, account, operation, payload, external ID, or idempotency key differs from this one, for example a charge approved for account A that the developer now wants for account B
- a yes to some rows, which covers only those rows. Rebuild the preview with just those rows and confirm it.
- in a session the Straddle Wizard reopened, any approval given before the reopen message, even for this exact preview, and even for a write that was interrupted before it finished. Show the whole preview table again in this run, before you ask, rather than pointing back to a preview from before the reopen message, as [Reopened sessions](../../straddle-best-practices/references/wizard-program.md#reopened-sessions) says.

A no, a changed target or payload, or no answer means zero writes. On a no, print `STRADDLE_ABORT` with `developer denied the Sandbox preview`, continue at step 6, and hand off with `blocked`. On a change, rebuild the preview and ask again. Without an answer, including when you end your turn to wait for one, send nothing and continue at step 6 and step 7 before ending the turn. Step 7's reply is then the reply that asks for approval: after its report, give the three parts above in full, even if you showed them earlier in the turn, and never point back to a preview above. The report then says `Status: partial (awaiting approval of the Sandbox preview)` at this run's plan hash, and the `awaiting_approval` handoff's sentence asks for the yes or no. A later explicit yes may continue at step 5 only if the exact preview and its environment, base URL, account, operation, and payload remain unchanged; otherwise show a new preview and ask again.

**Summary for step 5:** the approved rows exactly as shown, the approval kind (`one-time` or `standing`), and the approval time, or the reason there is no approval.
