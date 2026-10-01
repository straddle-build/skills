# Step 5: Report

- **Needs:** step 4 summary.
- **Tools:** Write for `straddle-audit-report.md` at the repository root only.
- **Next:** [06-recover.md](06-recover.md) if the developer approves any fix; otherwise end here with the handoff.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-audit","step":"05-report"}
```

Write `straddle-audit-report.md` in this shape. In chat, open with two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md), leading with the finding that matters most, then show the report's summary and findings table:

```markdown
# Straddle audit

Status: findings | clean | blocked
SDK: <package version, source path>   Contract: <version>   Model: <direct / SaaS / marketplace / unknown>   Environment: <host / unknown>

## Symptom
<sanitized>

## Findings
| # | File:line | Category | Finding | Confidence | Evidence (SDK / contract) | Recovery |
| --- | --- | --- | --- | --- | --- | --- |

## Checked and dismissed
| File:line | Hypothesis | Why dismissed |
| --- | --- | --- |

## Context gathered
<versions, request IDs, configuration errors, the optional read if one ran>

## Recovery steps
1. <ordered, concrete steps; remote writes are for the developer to run with preview and approval>
```

Order findings by impact: money movement and safety first, then account scope, notifications, SDK drift, contract drift.

End the report with the checklist below. Leave every box unchecked. The checklist is for the developer to tick after checking, not a record of what the skill verified.

```markdown
## Verify before merging

- [ ] Each finding cites application `file:line` and the installed SDK or contract evidence that confirmed it.
- [ ] Dismissed hypotheses are listed with the reason.
- [ ] No key, token, signing secret, account number, or customer PII appears in this report.
- [ ] No code changed before a finding was approved.
- [ ] `git status` was checked in every worktree before any commit.
```

Ask the developer which findings, if any, to fix. If none, print the handoff, followed by one or two short sentences: the result, then what's next:

```text
STRADDLE_HANDOFF {"skill":"straddle-audit","status":"<status>","report":"straddle-audit-report.md: <one-paragraph summary>"}
```

**Summary for step 6:** the findings the developer approved for fixing, by number.
