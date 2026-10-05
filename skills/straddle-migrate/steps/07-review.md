# Step 7: Review

- **Needs:** step 2 baseline, the approved table, step 6 summary.
- **Tools:** Read. Bash for `git status --porcelain`, `git diff --numstat`, `git diff`, and the repository's test command.
- **Next:** [08-report.md](08-report.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-migrate","step":"07-review"}
```

Check only the files the step 6 summary touched, and prove each of these:

1. **Only approved files changed.** Every path in `git status --porcelain` that was not in the baseline is in the approved table. Anything else is reverted by you only if you created it in this run; otherwise report it.
2. **Additive.** `git diff --numstat` shows zero deleted lines in pre-existing files, or each deletion is a line you added earlier in this run. Report any other deletion as a failure.
3. **Provider code intact.** Every step 2 call site is still present.
4. **Boundaries in code.** No new code reads `.env*` directly, logs a key, calls `execute-request`, loops on Straddle resource reads for status, or copies customer data.
5. **Mapping implemented.** Every row of each of the plan's status mapping tables has code and a test. A payment translation handles all nine Straddle payment statuses, with `failed` and `reversed` kept distinct. An identity translation handles all five Straddle customer statuses, and no customer status goes through a payment translation. Check only the tables the plan has.
6. **Tests.** Run the repository's test command and record the result. A failure is reported, not hidden.

**Summary for step 8:** each check with pass or fail and evidence.
