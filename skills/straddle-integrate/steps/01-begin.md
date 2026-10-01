# Step 1: Begin

- **Needs:** the developer's request and `straddle-integration-plan.md` at the repository root.
- **Tools:** Read, Glob, Grep; Bash only for the offline checks below, the plan approval hash, `straddle --version`, and `straddle auth status --agent`. Edit only for the two approval lines in the plan's Status section, as [Recorded approval](#recorded-approval) says. No other writes, and no command that can reach Straddle, including `straddle doctor`.
- **Next:** [02-sources.md](02-sources.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-integrate","step":"01-begin"}
```

Read [straddle-best-practices](../../straddle-best-practices/SKILL.md).

## The approved plan

Read `straddle-integration-plan.md`. Integrate needs, from the plan:

- an approval: a [recorded approval](#recorded-approval) that matches the current file, or the developer approving the current plan in this conversation. In a session the Straddle Wizard reopened, only the recorded approval counts, or one the developer gives after the reopen message, as [Reopened sessions](../../straddle-best-practices/references/wizard-program.md#reopened-sessions) says.
- integration type, SDK, and notification path decided, not `Unresolved`
- the file-change table, which becomes the only files Integrate may change
- the future Sandbox writes table

If there is no plan, or it is not approved, print `STRADDLE_ABORT` with the reason, skip steps 2 to 6, and go straight to [step 7](07-handoff.md). It writes the `blocked` report, with plan hash `none (plan not approved)`, and prints the `blocked` handoff that sends the developer to [straddle-plan](../../straddle-plan/SKILL.md). Change no file and send no Straddle request on the way. Do not reconstruct a plan from the request. A request that adds files or writes beyond the plan needs the plan updated and approved first. Say which items are new.

### Recorded approval

A later step may run in a new session, so an approval lasts only when it is written into the plan. The Status section records it in two lines:

```markdown
- Plan state: Approved
- Approval: <YYYY-MM-DD>, "<the developer's words>", recorded by <straddle-plan | straddle-integrate | straddle-test>, sha256 <64 hex characters>
```

The hash covers the plan file without those two lines, so recording them doesn't change it. Compute it with:

```bash
grep -v -e '^- Plan state:' -e '^- Approval:' straddle-integration-plan.md | { sha256sum 2>/dev/null || shasum -a 256; } | cut -c1-64
```

- **Accept** a recorded approval, including one from an earlier session, only when the state is `Approved` and the command prints the recorded hash.
- **Reject** `Approved` with no `Approval` line or with a different hash. The plan changed after approval, or the approval was never recorded. Say so, and treat the plan as unapproved until the developer approves the current file.
- **Record** an approval when the plan has no valid one and the developer approves the current plan in this conversation, in their own words. In a reopened Wizard session, that approval must come after the reopen message. Before step 2, set `Plan state: Approved`, run the command, and write the `Approval` line with today's date, their words, `recorded by straddle-integrate`, and the hash. Change nothing else in the plan.

Keep the hash the command printed as this run's plan hash. Step 7 writes it into `straddle-integration-report.md`, and Test and the Straddle Wizard use it to tell which plan a report belongs to. When no approval was accepted or recorded, the plan hash is `none (plan not approved)`.

## Configuration, offline first

Establish the environment and credential presence before running any command that can reach Straddle. `straddle doctor` does not qualify, because it sends `GET /` before it checks auth, so do not use it as a preflight. Never print, echo, or read a credential value, and never open `.env*` files or the CLI's config file.

```bash
printf 'STRADDLE_ENVIRONMENT=%s\n' "${STRADDLE_ENVIRONMENT:-<unset>}"
printf 'STRADDLE_BASE_URL=%s\n' "${STRADDLE_BASE_URL:-<unset>}"
if [ -n "${STRADDLE_API_KEY:-}" ]; then key=present; else key=missing; fi
echo "STRADDLE_API_KEY $key"
```

**Environment.** Only an explicit selection counts: `STRADDLE_ENVIRONMENT=sandbox`, or `STRADDLE_BASE_URL=https://sandbox.straddle.com`, in the environment the run executes in. A default is not a selection. That includes the SDK's default base URL and the CLI's `runtime_context.environment`, which reports what the CLI resolved, not what the developer chose. The one other accepted target is an explicitly declared offline synthetic localhost upstream, under every condition in [offline-synthetic-target.md](../references/offline-synthetic-target.md). Any other value, including Production, an undeclared localhost URL, or any other host, is a configuration error for Integrate.

**Credential presence, per route.** Each check reports presence only and never proves the key works.

- **SDK and application code** read `STRADDLE_API_KEY` from the process environment, so the presence line above is the check.
- **CLI.** `straddle auth status --agent` reads only the CLI's local configuration and sends no request. It reports `authenticated` and a `source` (the environment variable or saved CLI auth) without the value. Saved CLI auth is a valid credential for CLI rows.
- **API MCP.** The key lives in the client's secret input, where Integrate cannot see it. Ask the developer whether they set it, and never ask for the value. When they confirm, a permitted authenticated read can then show whether it works.
- When a check cannot run, for example because the CLI is not installed, ask the developer to confirm presence, and record the answer as `developer-confirmed, not verified`. Record `unknown` when there is no answer.

Record, for each route the plan's writes use:

- **configured:** the environment is explicitly Sandbox, and that route's credential is present or developer-confirmed. Record the target as `Straddle Sandbox` or `offline synthetic localhost <exact base URL>`.
- **configuration error:** the environment is not explicit or not Sandbox, a localhost target is missing any condition in [offline-synthetic-target.md](../references/offline-synthetic-target.md), or that route has no credential or an unknown one. Name exactly what is missing.

A configuration error does not stop code changes to approved files, because those send no request. It does stop every Straddle request on the affected routes later in the run: no SDK call, CLI command without `--dry-run`, or `execute-request`. Say so now, in one sentence, so the developer can fix it in their own shell while the code work proceeds.

For a SaaS or marketplace plan, also record the acting accounts the plan names (A and B), or that they do not exist yet.

**Summary for step 2:** plan state and plan hash, integration type, SDK, notification path, the approved file list, the planned Sandbox writes, the configuration result, and the acting accounts.
