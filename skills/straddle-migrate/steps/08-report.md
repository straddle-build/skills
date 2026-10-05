# Step 8: Report

- **Needs:** every earlier summary, including the plan hash from step 5 or 6.
- **Tools:** Write for `straddle-migration-report.md` at the repository root only. Never edit the plan here: any change to it voids its approval hash.
- **Next:** [straddle-test](../../straddle-test/SKILL.md) to prove the new path in Sandbox, after the developer reviews the diff. Test reads the approved `straddle-migration-plan.md` and its Verification section directly; no `straddle-integration-plan.md` is needed, and the plan's approval authorizes no Sandbox write. In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, a `migrated` status ends Migrate, not the turn: start the next listed skill in this same reply, as that page says. This step's Tools line doesn't limit that. Any other status stops and waits for the developer.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-migrate","step":"08-report"}
```

Write the report to `straddle-migration-report.md` at the repository root, replacing an earlier one, and give the same report in your reply. Open the reply with two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md): what changed, what didn't, and what's next. When the client doesn't allow the write, give the report in the reply and say `straddle-migration-report.md` wasn't written.

The header block comes first, because the Straddle Wizard reads it to tell whether Migrate finished. `Status` is the handoff status, with the reason when it's `awaiting_approval` or `blocked`. It's `migrated` only when the approved edits are made and step 7 reviewed them; an approval alone is never `migrated`. `Plan hash` is the approval hash step 6 checked before the first edit, or step 5 recorded when step 6 didn't run, and `none` when the plan has no accepted approval. Never write a key, token, or customer data into the report.

```markdown
# Straddle migration report

Status: migrated | awaiting_approval (<reason>) | blocked (<reason>)
Plan: straddle-migration-plan.md
Plan hash: <64 hex characters> | none
Provider: <provider>   Model: <direct / SaaS / marketplace>   SDK: <package version>

## Plan
`straddle-migration-plan.md`, <n> authorized modifications, approval <recorded / not given>.

## Changes
| File | Change | Plan row |
| --- | --- | --- |

## Review
| Check | Result | Evidence |
| --- | --- | --- |

## Not done by this skill
- Customer data, tokens, and history stay with <provider>.
- <declined requests>

## Next
```

End with the checklist below. Leave every box unchecked. The checklist is for the developer to tick after checking, not a record of what the skill verified.

```markdown
## Verify before merging

- [ ] Every changed file is listed in the approved plan.
- [ ] No existing provider code, test, or config was deleted or rewritten.
- [ ] The Straddle path is off by default or switched exactly as the plan says.
- [ ] Missing Straddle key or environment raises a configuration error in the new code.
- [ ] No customer data, provider token, or key appears in code, tests, the plan, or this report.
- [ ] Every provider status the code used maps to a Straddle status of the same resource in the plan: payment statuses with `failed` and `reversed` handled separately, and customer statuses for identity.
- [ ] For payment flows, the consent decision for Straddle-path customers is recorded, with who made it.
- [ ] Tests ran, and their result is stated above.
```

Then print the handoff, followed by one or two short sentences: what finished, then what comes next:

```text
STRADDLE_HANDOFF {"skill":"straddle-migrate","status":"<status>","report":"<one-paragraph summary>"}
```
