# Straddle Wizard program

The Straddle Wizard can run the whole integration in one agent session. It starts the session with a request that contains a line beginning `Straddle Wizard program:`. That line lists the steps for this session and says where to start, for example `Start at straddle-plan.` Run only the steps the line lists, in its order. When its last step finishes, the program ends for this session, even if later steps exist. Without that line, each skill runs on its own and ends at its handoff, as its step files say.

The program, in order:

1. [straddle-setup](../../straddle-setup/SKILL.md)
2. [straddle-plan](../../straddle-plan/SKILL.md)
3. [straddle-migrate](../../straddle-migrate/SKILL.md), only when the program line includes it because the repository uses another payment provider
4. [straddle-integrate](../../straddle-integrate/SKILL.md)
5. [straddle-test](../../straddle-test/SKILL.md)
6. [straddle-go-live](../../straddle-go-live/SKILL.md)

## Continue in the same session

Outside a Wizard program, the handoff ends the turn. In a Wizard program, a finished skill's handoff ends that skill, not the turn. Print the handoff and its sentence, then start the next listed skill in the same message. Reading this page and the next skill's `SKILL.md`, or invoking it, is allowed whatever the last step's Tools line says. Stop only when the last listed skill finishes, the developer stops the run, or progress needs the developer's decision or approval. A blocked, partial, or failed step stays current until the developer resolves it or explicitly asks to move on, and moving on grants no approval.

When a skill finishes its handoff in a program session:

- **Finished:** tell the developer in one sentence what's next, then start the next skill in this session, the way this client starts a skill (for example Claude Code's Skill tool) or by reading its `SKILL.md`. Don't stop to wait for the Wizard, and don't ask whether to continue. A reply that only announces the next step stops the program. The table below says when a step has finished.
- **Not finished** (blocked, awaiting an approval or a decision, partial, or failed): stop at that step. Say in a sentence or two what the developer needs to do, and wait for them. If you name the next skill, say it starts only once this step finishes, for example after a yes and the approved write has run. A no or a denial leaves this skill current, so never say the next skill starts whatever the developer answers.
- **Load only the next skill.** Open its `SKILL.md`, then one step file at a time, as its Markers section says. Don't reread an earlier skill's step files. Take an earlier step's results from its file in the table, not from memory, because the developer may have changed it.
- **Reuse the shared references.** Reuse best-practices, `voice.md`, `show-me.md` and this page while they're in context and unchanged. Reread one if it's missing or changed.
- **Each skill keeps its own rules.** Its step files set its tools, writes, and boundaries. Nothing carries over from the skill before it. A skill doesn't continue into the developer's original request or answer for them.
- **The program line approves nothing.** It isn't a plan approval, a write approval, or an answer to any question a skill asks. Plan approval still needs the developer's own words, and every Sandbox write still needs its own preview and an explicit yes.

## Reopened sessions

`wizard resume` can reopen an earlier conversation, so earlier previews and yeses are back in context. When it does, the message that carries the program line also says, word for word:

> This session was reopened by the Straddle Wizard. Approvals given before this message don't count: show every Sandbox write preview again and ask; a plan approval counts only as recorded in the plan file.

Follow that rule for the rest of the session, and apply it even if the sentence is missing: an approval counts only when it came after the latest message that carries the `Straddle Wizard program:` line.

- **Sandbox writes.** Show every write's preview again, even one the developer approved before, and ask again. Run nothing on an earlier yes, including a write that was approved and interrupted before it finished. Its recovery still uses the same idempotency key and external ID, after the new yes.
- **Plan approval.** Accept only an approval recorded in the plan file whose hash matches, as Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval) says. A "yes" to the plan earlier in the conversation doesn't count and isn't recorded now. Ask the developer to approve the current plan again in a new message.
- **Other answers.** Decisions the developer gave before, such as the integration type or an SDK, may be reused when a step file records them. Anything a step asks the developer to approve is asked again.

## When the program includes Migrate

Two plans exist then, and each step uses one:

- Migrate implements `straddle-migration-plan.md`: the Straddle code it adds beside the other provider. Its report records that plan's hash.
- Integrate, Test and Go Live use `straddle-integration-plan.md` from straddle-plan. Integrate changes only the files that plan lists. Where Migrate already wrote the code a row needs, Integrate reads it and adds only what the row still lacks, then previews the integration plan's Sandbox writes.
- Test uses the plan Integrate's handoff names, the integration plan, so it doesn't ask which plan to test.

## Step files

Each step records its state in a file at the repository root, starting with a small header block. The Wizard resumes from these files, so write the header exactly as shown.

| Step | File | Header | Finished when |
| --- | --- | --- | --- |
| Setup | `straddle-setup.md` | `Status: complete` or `Status: blocked (<reason>)`, then `Environment:`, `Integration type:`, `API key present: yes` or `no`, `SDK:`, `Acting account:` | `Status: complete` |
| Plan | `straddle-integration-plan.md` | `- Plan state: Draft`, `Approved`, or `Blocked`, and `- Approval: none` or the recorded approval with its sha256 | step 6 recorded `Approved` with a hash that matches the plan |
| Migrate | `straddle-migration-report.md` | `Status: migrated`, `Status: awaiting_approval (<reason>)`, or `Status: blocked (<reason>)`, then `Plan: straddle-migration-plan.md` and `Plan hash:` | `Status: migrated` for the current migration plan's hash. An approved migration plan alone isn't finished. |
| Integrate | `straddle-integration-report.md` | `Status: complete`, `Status: partial (<reason>)`, or `Status: blocked (<reason>)`, then `Plan:` and `Plan hash:` | `Status: complete` for the current plan's hash |
| Test | `straddle-test-evidence.md` | `Status: complete`, `Status: partial (<reason>)`, or `Status: blocked (<reason>)`, then `Plan:`, `Plan hash:`, `Latest run:`, and `Test charge:` | `Status: complete` for the current plan's hash |
| Go Live | `straddle-go-live-report.md` | `Status: ready` or `Status: not ready (<reasons>)`, then `Plan:` and `Plan hash:` | `Status: ready` for the current plan's hash. A `not ready` report sends the Wizard back to Go Live, which shows the listed gaps. In this session Go Live is still the last step. |

`Plan hash` is the plan's approval hash, computed with the same command as the `Approval` line in Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval), on the plan file the step used. A report counts only for the current hash of the plan its `Plan:` line names. A report with any other `Plan hash` is for an older plan, so that step hasn't finished for this one. Only the approval lines go into a plan. Every later step records its result in its own file, because any other edit to a plan changes its hash. Never write a key, token, or other secret value into any of these files.

## When the program ends

After Go Live's handoff, close with a short summary: each step and its result, the files above, and the Sandbox test charge ID from the evidence file's `Test charge:` line, so the developer can find it in the Sandbox dashboard. Name what's still open, such as a partial Test or the Go Live gaps. Don't start anything new.
