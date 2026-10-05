# Step 1: Begin

Print this marker once now, before any tool call, including reading straddle-best-practices or the next step file:

```text
STRADDLE_PROGRESS {"skill":"straddle-migrate","step":"01-begin"}
```

- **Needs:** the developer's request.
- **Tools:** Read. Bash only for the three configuration commands below and, when `straddle-migration-plan.md` exists, step 5's approval hash command, none of which sends a Straddle request. No other shell commands, including shell reads such as `cat`, `ls`, `find`, `grep`, or `head`: read files with Read. No writes.
- **Next:** [02-inventory.md](02-inventory.md), or the `blocked` handoff when the key or environment is missing.

Read [straddle-best-practices](../../straddle-best-practices/SKILL.md) and keep its rules in force.

## Key and environment, offline

Check both before anything else, under [environments-and-credentials.md](../../straddle-best-practices/references/environments-and-credentials.md). If the developer pasted this output in this run, use it instead of running the commands.

```bash
straddle auth status --agent
printenv STRADDLE_ENVIRONMENT
printenv STRADDLE_BASE_URL
```

- **API key:** present only when `auth status` reports `authenticated: true`. Report its presence and source category, never a value or the `config` path. `authenticated: false`, `no credentials configured`, or no `straddle` CLI means the key is missing or can't be confirmed.
- **Environment:** set only when `STRADDLE_ENVIRONMENT` is `sandbox` or `STRADDLE_BASE_URL` is `https://sandbox.straddle.com`, or when neither is set and the developer names Sandbox in this run. An unset variable prints nothing.

When either is missing, stop here, before scoping, planning, or any other tool call. Right after the progress marker, before any list or table, print the line for each missing setting word for word on its own line, then "No Straddle API request was sent." A list row or a paraphrase never replaces the line.

| Missing | Line to print | Fix, in the developer's own shell |
| --- | --- | --- |
| API key | **Blocking configuration failure: no API key (`STRADDLE_API_KEY` is not set).** | `export STRADDLE_API_KEY='YOUR_SANDBOX_KEY'`, with `YOUR_SANDBOX_KEY` replaced by their Sandbox key in their own terminal, or save a key with the Straddle CLI. Never paste the key into chat. |
| Environment, unset | **Blocking configuration failure: environment not explicitly selected (`STRADDLE_ENVIRONMENT` is not set).** | `export STRADDLE_ENVIRONMENT=sandbox`. Confirming Sandbox in chat is enough. |
| Environment, not Sandbox | **Blocking configuration failure: environment is not Sandbox (`STRADDLE_ENVIRONMENT` must be `sandbox`).** | `export STRADDLE_ENVIRONMENT=sandbox` and `unset STRADDLE_BASE_URL`. |

Then give that fix in one or two sentences, or offer [straddle-setup](../../straddle-setup/SKILL.md). Print the `blocked` handoff and end the turn. When the developer says it is set, run this check again.

## Scope

Restate the scope to the developer in two or three sentences: new Straddle code beside the existing provider, a written plan they approve before any edit, no deleted code, and no customer data moved.

If the request itself asks to move data (for example "import our Dwolla customers into Straddle", "copy the Plaid access tokens over", "backfill payment history"), decline that part now, explain that customer-data transfer is outside this skill, and offer the code migration instead. Continue only with the code migration, and record the declined part for the report.

If `straddle-migration-plan.md` exists, read it. A recorded approval is valid only when `- Plan state:` is `Approved` and step 5's hash command on the plan prints the `- Approval` line's sha256. That line may be recorded by straddle-migrate, with `rows <n>`, or by straddle-test, without it; both cover the whole authorized-modifications table, because the hash covers the whole plan. Treat any other approval line, or any edit to the plan after approval, as unapproved. Treat it as unapproved too, even with a matching hash, when the same condition holds that stops step 5 from recording one: `- Plan state:` is `Blocked`, or an `Unresolved` item affects a listed file. An approval never clears a blocker. An entry under `## Blocked` for a file that isn't in the Authorized modifications table, and that this migration won't touch, doesn't by itself make the approval invalid.

**Summary for step 2:** key and environment present, requested provider, declined requests, existing plan and approval state, and the hash step 1 checked when a recorded approval is valid.
