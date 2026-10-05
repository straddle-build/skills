# Step 5: Approval

Print this marker once now, before any tool call, including AskUserQuestion or reading the next step file:

```text
STRADDLE_PROGRESS {"skill":"straddle-migrate","step":"05-approval"}
```

- **Needs:** step 4 summary and the written plan.
- **Tools:** AskUserQuestion when available, otherwise ask in chat. Edit for `straddle-migration-plan.md` only, to record the answer, and Bash only for the approval hash command below.
- **Next:** [06-edit.md](06-edit.md) on approval; [08-report.md](08-report.md) otherwise, including when you end the turn to wait for the answer.

Tell the developer in a plain sentence that the plan is ready for their review, as [voice.md](../../straddle-best-practices/references/voice.md) says. Show them the authorized-modifications table and the not-moved section, and ask for an explicit yes to exactly that plan. "Looks fine", silence, or a non-interactive run is not approval.

- **Already approved:** when step 1 found a valid recorded approval of this exact plan, recorded by this step or by straddle-test, do not ask again. Continue to step 6 with that hash.
- **Yes:** record the approval in the plan's two header lines the way Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval) does, on `straddle-migration-plan.md`: set `- Plan state: Approved`, compute the hash with that command on `straddle-migration-plan.md`, and write `- Approval: <YYYY-MM-DD>, "<the developer's words>", rows <n>, recorded by straddle-migrate, sha256 <hash>`. Change nothing else. Any later edit to the plan changes the hash and voids the approval. Continue to step 6.
- **Changes requested:** update the plan, then ask again. The earlier answer does not carry over.
- **Plan state is `Blocked`, or the plan has `Unresolved` items that affect a listed file:** do not ask for approval yet, and never record one, even when the developer says yes. Go to step 8 and hand off there with `awaiting_approval`.
- **No answer yet,** including when you end the turn at the question: go to step 8 before the turn ends. It writes `straddle-migration-report.md` with `Status: awaiting_approval` and hands off `awaiting_approval`, and its handoff sentence asks for the yes or no.
- **No or stop:** print `STRADDLE_ABORT` with the reason and go to step 8.

**Summary for step 6:** approval recorded (yes or no), the approved rows, and the recorded hash.
