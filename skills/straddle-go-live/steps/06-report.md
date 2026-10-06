# Step 6: Report

- **Needs:** summaries from steps 2 to 5.
- **Tools:** Write for `straddle-go-live-report.md` at the repository root only. Bash only for the plan hash command in Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval) and, in a Wizard session, the payment review's code hash command.
- **Next:** the developer's decision. Failed rows route to [straddle-audit](../../straddle-audit/SKILL.md) or [straddle-test](../../straddle-test/SKILL.md). In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, Go Live is the last step: close the program as that page says.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-go-live","step":"06-report"}
```

The status is `ready` only when every required row passed with tool evidence or developer confirmation. Any `fail` or `unproven` required row makes it `not_ready`. A configuration failure that leaves the environment unknown makes it `blocked`.

Write the review to `straddle-go-live-report.md` at the repository root, replacing an earlier one, then give the same review in full in your reply, from its heading through the checklist below. Open the reply with two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md): whether it's ready, the gaps that matter most, and what's next. When the client doesn't allow the write, say in the reply that `straddle-go-live-report.md` wasn't written.

In the review, the `Status` line comes first, under its heading, because the Straddle Wizard reads it: `ready`, or `not ready (<each blocking gap>)` for both `not_ready` and `blocked`, with a `blocked` review naming its configuration error there. `Plan` is the plan the Sandbox evidence names on its `Plan:` line, or else `straddle-integration-plan.md`, or else `straddle-migration-plan.md`, and `none` when there is none. `Plan hash` is that command's output for the plan file, `none` without a plan, or `unknown` when the command can't run here. A `ready` review counts for the Wizard only at the current plan's hash.

When the checklist's Payment review row applies, compare the report's `Plan hash` with this one, and its `Code hash` with the `code-hash` line from straddle-payment-review's `scripts/session-state compare <snapshot>`, run now from the repository root with the `snapshot` from `.straddle-wizard/session-baseline.json`. The payment review is advisory and never a blocking gap, so it never changes `Status` or `Result`. List each Critical or High row of a current report under "Payment review warnings" with its file:line and impact. A missing, `incomplete`, or mismatched report, or the script exiting non-zero, is one warning: `payment review not current for this code`. Don't call the payment review a security review or say a clean one makes the code safe. When the row doesn't apply, add `- No payment review ran: this wasn't a Straddle Wizard session.` under "What this review did not do".

```markdown
# Straddle Go Live review

Status: ready | not ready (<each blocking gap, comma-separated>)
Plan: straddle-integration-plan.md | straddle-migration-plan.md | none
Plan hash: <64 hex characters> | none | unknown
Result: ready | not_ready | blocked
Model: <direct / SaaS / marketplace>   SDK: <package version>   Environment checked: <host / unknown>

## Blocking gaps
| Row | Result | Evidence | Fix |
| --- | --- | --- | --- |

## Payment review warnings
Advisory, not a security audit, never blocking. <each open Critical or High finding as `- <Severity> <file:line>: <impact>`, or `None.`>

## Checklist
| Section | Row | Result | Evidence |
| --- | --- | --- | --- |

## Declined requests
## What this review did not do
- No production write was made or authorized.
- <production read: not run / ran once with status N>
```

End with the checklist below. Leave every box unchecked. The checklist is for the developer to tick after checking, not a record of what the skill verified.

```markdown
## Verify before merging

- [ ] Every `pass` row cites a file, test output, or a labeled developer confirmation.
- [ ] No key, signing secret, or `.env` content appears in this report.
- [ ] No production resource was created, changed, or deleted.
- [ ] The production notification endpoint is a webhook, FIFO, or polling endpoint, not API polling or Dashboard email.
```

Then print the handoff, followed by one or two short sentences: the result, then what comes next:

```text
STRADDLE_HANDOFF {"skill":"straddle-go-live","status":"<status>","report":"<one-paragraph summary with the blocking gaps>"}
```
