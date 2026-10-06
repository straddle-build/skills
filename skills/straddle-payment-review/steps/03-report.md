# Step 3: Report

- **Needs:** findings from step 2, or the reason step 1 stopped.
- **Tools:** In a Wizard review, none that write: print the report. Otherwise, Write for `straddle-payment-review.md` at the repository root only. Outside a Wizard review, Bash only for the plan hash command in Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval).
- **Next:** the Wizard or the developer. Go Live reads `straddle-payment-review.md`.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-payment-review","step":"03-report"}
```

The `Status` line is `findings` when at least one finding remains, `clean` when none do, and `incomplete (<reason>)` when step 1 couldn't establish the session's changes. `Plan hash` is, in a Wizard review, the value in the scope's `plan-hash.txt`; otherwise the plan hash command's output for `straddle-integration-plan.md`, `none` when that file doesn't exist, or `unknown` when the command can't run here. `Code hash` is the hash from the `code-hash` line of step 1 (the scope's `changes.txt` in a Wizard review), so a later code change makes this report stale. An `incomplete` report has `Code hash: none`. The Wizard and Go Live read these lines, so give them exactly as shown. Sort findings Critical, High, Medium, Low.

**In a Wizard review** (the request carries `Straddle Wizard review: print the report; don't write files.`), write no file. Print the whole report once in your reply, outside any code fence, between these two lines, each on a line of its own with nothing else on it:

```text
STRADDLE_REPORT_BEGIN {"skill":"straddle-payment-review","file":"straddle-payment-review.md"}
STRADDLE_REPORT_END {"skill":"straddle-payment-review"}
```

The Wizard saves the lines between them as `straddle-payment-review.md`, so the first line inside is `# Straddle payment review`, and no other line inside starts with `STRADDLE_`. Keep the report under 64 KiB. The Wizard rejects a block that is incomplete, too large, or missing a header line, and then counts the review as incomplete.

**Otherwise**, write the report to `straddle-payment-review.md`, replacing an earlier one.

The report, in both cases:

```markdown
# Straddle payment review

Status: clean | findings | incomplete (<reason>)
Plan hash: <64 hex characters> | none | unknown
Code hash: <64 hex characters> | none
Snapshot: <snapshot sha | none>, started <startedAt>
Session files reviewed: <count>

This review is advisory. It is not a security audit, and a clean report does not mean the code is safe.

## Findings

| Severity | File:line | Impact | Fix |
| --- | --- | --- | --- |
| Critical | src/checkout.ts:14 | <who could do what> | <one-sentence fix> |

## What this review did not do

- No code was changed and no command wrote to the working tree.
- No network request was made and no app code ran.
- Code the session didn't change was read only to judge session changes.
- It checked the fixed payment-path list in this skill, nothing else. It doesn't block Go Live.
```

Leave the findings table with only its header row when there are none. Never put a key, signing secret, or token value in the report.

Then give the developer two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md): the status, the Critical and High findings by file:line, that the review is advisory and not a security audit, and that fixes go through [straddle-integrate](../../straddle-integrate/SKILL.md) only with their approval. Then print the handoff, after the report block in a Wizard review, with the same status word as the report's `Status` line:

```text
STRADDLE_HANDOFF {"skill":"straddle-payment-review","status":"<clean|findings|incomplete>","report":"straddle-payment-review.md: <one-paragraph summary>"}
```

This skill runs alone, in its own session. Don't start another skill after the handoff, even when the request carries a `Straddle Wizard program:` line.
