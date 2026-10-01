# Step 6: Recover

- **Needs:** the developer's explicit approval naming the findings to fix.
- **Tools:** Read, Edit, Write on the files those findings cite and their tests. Bash for `git status --porcelain`, `git diff`, and the repository's test command. No remote writes.
- **Next:** end with the handoff.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-audit","step":"06-recover"}
```

For each approved finding:

1. Compare `git status --porcelain` with the step 1 baseline. If a file you need already has someone else's uncommitted changes, stop and ask.
2. Make the smallest change that implements the recovery, using the installed SDK's own parameters and helpers.
3. Add or update a test that fails without the change.
4. Run the repository's test command and record the result. When the client's command sandbox blocks the test runner, follow Test's [offline step](../../straddle-test/steps/02-offline.md) instead of asking to run outside it.

If the developer approves parallel fixes, each subagent or worktree gets the absolute repository path and the finding numbers it owns. Before any commit, run `git status` in every worktree from `git worktree list` and confirm each contains only its own finding's files.

Do not commit unless the developer asks. Update `straddle-audit-report.md` with each finding's fix status and test result.

Print the handoff, followed by one or two short sentences: what's fixed, then what's left:

```text
STRADDLE_HANDOFF {"skill":"straddle-audit","status":"<findings | clean>","report":"straddle-audit-report.md: <fixed findings, remaining findings, test result>"}
```
