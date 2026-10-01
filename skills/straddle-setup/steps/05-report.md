# Step 5: Report

- **Needs:** summaries from steps 2 to 4.
- **Tools:** Write for `straddle-setup.md` at the repository root only.
- **Next:** hand off to [straddle-plan](../../straddle-plan/SKILL.md) when the status is not `blocked`. When it is `blocked`, the run ends at the handoff and waits for the developer. In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, a status other than `blocked` ends Setup, not the turn: start the next listed skill in this same reply, as that page says. This step's Tools line doesn't limit that.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-setup","step":"05-report"}
```

## Classify

Classify every row. A check that did not run is never `passed`.

The status is `blocked` when any of these holds:

- no API key (a configuration failure, even though every other check ran)
- an environment that was not explicitly selected (a resolved default without developer confirmation is a configuration failure)
- an environment other than Sandbox, an invalid saved context, or a reachability check that ran and failed
- the Straddle CLI is missing
- the Docs MCP is not registered or its search failed
- the API MCP is not registered or its discovery failed
- an authenticated check ran and failed
- the plugin version disagrees with the running client's native manifest version
- the agent client is not Claude Code, Codex, or Cursor
- the integration type or SDK is unknown and the developer has not answered

The status is `ready_with_warnings` when nothing blocks but something is incomplete: a reachability or authenticated check `not run`, a CLI older than v1.0.3 (no `runtime_context` and no `--idempotency-key` on creates), no acting account on a platform, fewer than two Sandbox accounts for a platform, the chosen SDK not installed yet, a retired SDK installed, a plugin or skill version that could not be read, or a Docs MCP that exposes execution tools. Otherwise it is `ready`.

## Report

Write the report to `straddle-setup.md` at the repository root, replacing an earlier one, and give the same report in your reply. Open the reply with two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md): whether the project is ready, the one thing that matters most, and what happens next. When step 3 found a blocking configuration failure, print its bold line from step 3 word for word on its own line right after those sentences, before any table, then "No Straddle API request was sent." For example: **Blocking configuration failure: no API key (`STRADDLE_API_KEY` is not set).** A table row or paraphrase never replaces that line. The sentences around it name what the developer sets and where. When the client doesn't allow the write, give the report in the reply and say `straddle-setup.md` wasn't written.

The header block comes first, because the Straddle Wizard reads it. `Status` is `complete` when the classification above is `ready` or `ready_with_warnings`, and `blocked (<each blocking check>)` when it is `blocked`. The `API key present` line says `yes` or `no` and never holds a value.

```markdown
# Straddle Setup report

Status: complete | blocked (<each blocking check, comma-separated>)
Environment: <base URL>, explicitly selected (env var / developer-confirmed) | <base URL>, resolved default only | unknown
Integration type: account | saas | marketplace | unknown
API key present: yes (env var / saved CLI credentials), not verified | no
SDK: <package> <version> | not installed, add <package> <version> | unknown
Acting account: <id> | none | not required
Setup result: ready | ready_with_warnings | blocked

| Check | Result | Evidence |
| --- | --- | --- |
| Agent client | Claude Code / Codex / Cursor / unsupported | session |
| Agent Plugin | <version> / unknown | plugin root `plugin.json` |
| Native client manifest | <version> / none for this client | `.claude-plugin/`, `.codex-plugin/`, or `.cursor-plugin/` `plugin.json` |
| Skills | straddle-setup <version>, straddle-plan <version>, straddle-best-practices <version> | skill `metadata.version` |
| Straddle Wizard | not installed / <version> | |
| Straddle CLI | <version> / missing; idempotent creates yes (v1.0.3 or later) / no | `straddle --version` |
| API key | present (env var / saved CLI credentials), not verified / missing (configuration failure) | `straddle auth status` |
| Environment | <base URL>, explicitly selected (env var / developer-confirmed) / resolved default only (configuration failure) | `agent-context`, `printenv STRADDLE_ENVIRONMENT`, `printenv STRADDLE_BASE_URL`, developer |
| API reachability (CLI) | passed / failed / not run (<reason>) | `straddle doctor` |
| Authenticated request (CLI) | passed / failed (<status>) / not run (<reason>) | `straddle accounts list` |
| Integration type | account / saas / marketplace / unknown | runtime_context or developer |
| Acting account | <id> / none / not required | runtime_context |
| Sandbox accounts for A/B | <count> / unknown | |
| Docs MCP | search passed / warning: exposes execution tools / not registered / search failed | |
| API MCP discovery | passed / not registered / failed | summarize-openapi-specs |
| API MCP authenticated | passed / failed (<status>) / not run (<reason>) | execute-request GET /v1/accounts |
| SDK | <package> <version> / not installed, add <version> / choose one | lockfile |

## Blocking
## Warnings
## Unknown, needs the developer
## Next actions
```

Next actions are exact, non-destructive steps the developer can choose, such as `export STRADDLE_API_KEY` in their own shell or following the connect-mcp guide. When the status is `blocked`, they name what the developer sets and where, then end with running Setup again: no network check or Straddle request is offered, not even for after the fix. For a platform, the next Integrate action is creating or reusing the two Sandbox accounts after its preview and approval. Setup does not do it.

If the developer asked for Straddle operations rather than a readiness check, Setup runs none of them. List each requested operation under Next actions as work for [straddle-integrate](../../straddle-integrate/SKILL.md) once the blockers are fixed, and word the reply as [straddle-best-practices](../../straddle-best-practices/SKILL.md#when-a-rule-blocks-the-task) requires when a rule blocks the task.

End with:

```markdown
## Verify before merging

- [ ] No API key, token, or `.env` content appears in this report or the conversation.
- [ ] Authenticated checks marked passed were actually executed in this run.
- [ ] The environment is Sandbox.
- [ ] Setup created or changed nothing except `straddle-setup.md`.
```

Then print the handoff on one line, followed by one or two short sentences: the result, then the next step, for example "Setup's done. Planning the integration with you is next." or "I need a Sandbox API key before I call Straddle, so I haven't sent any Straddle API request. Set `STRADDLE_API_KEY` in the shell you start your agent from, then run Setup again.":

```text
STRADDLE_HANDOFF {"skill":"straddle-setup","status":"<status>","report":"<one-paragraph summary of the table and blockers>"}
```

Outside a Wizard program, the handoff ends Setup's turn. In either case, don't continue into the developer's original request after it, whether with more tool calls or by asking for values that would let the request run as asked. In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, a status other than `blocked` ends Setup, not the turn: start the next listed skill as that page says.
