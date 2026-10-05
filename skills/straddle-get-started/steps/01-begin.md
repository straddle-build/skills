# Step 1: Begin

Print this marker once now, before any tool call, including reading straddle-best-practices or the next step file:

```text
STRADDLE_PROGRESS {"skill":"straddle-get-started","step":"01-begin"}
```

- **Needs:** the developer's request.
- **Tools:** Read. Bash only for the three configuration commands below, which send no Straddle request. No other shell commands, including shell reads such as `cat`, `ls`, `find`, `grep`, or `head`: read files with Read. No MCP calls, no writes.
- **Next:** [02-repository.md](02-repository.md), or the `blocked` handoff when the key or environment is missing.

Read [straddle-best-practices](../../straddle-best-practices/SKILL.md) and keep its rules in force for the rest of the run.

## Key and environment, offline

Check both before anything else, under [environments-and-credentials.md](../../straddle-best-practices/references/environments-and-credentials.md). If the developer pasted this output in this run, use it instead of running the commands.

```bash
straddle auth status --agent
printenv STRADDLE_ENVIRONMENT
printenv STRADDLE_BASE_URL
```

- **API key:** present only when `auth status` reports `authenticated: true`. Report its presence and source category, never a value or the `config` path. `authenticated: false`, `no credentials configured`, or no `straddle` CLI means the key is missing or can't be confirmed.
- **Environment:** set only when `STRADDLE_ENVIRONMENT` is `sandbox` or `STRADDLE_BASE_URL` is `https://sandbox.straddle.com`, or when neither is set and the developer names Sandbox in this run. An unset variable prints nothing.

When either is missing, stop here, before the list below or any other tool call. Right after the progress marker, before any list or table, print the line for each missing setting word for word on its own line, then "No Straddle API request was sent." A list row or a paraphrase never replaces the line.

| Missing | Line to print | Fix, in the developer's own shell |
| --- | --- | --- |
| API key | **Blocking configuration failure: no API key (`STRADDLE_API_KEY` is not set).** | `export STRADDLE_API_KEY='YOUR_SANDBOX_KEY'`, with `YOUR_SANDBOX_KEY` replaced by their Sandbox key in their own terminal, or save a key with the Straddle CLI. Never paste the key into chat. |
| Environment, unset | **Blocking configuration failure: environment not explicitly selected (`STRADDLE_ENVIRONMENT` is not set).** | `export STRADDLE_ENVIRONMENT=sandbox`. Confirming Sandbox in chat is enough. |
| Environment, not Sandbox | **Blocking configuration failure: environment is not Sandbox (`STRADDLE_ENVIRONMENT` must be `sandbox`).** | `export STRADDLE_ENVIRONMENT=sandbox` and `unset STRADDLE_BASE_URL`. |

Then give that fix in one or two sentences, or offer [straddle-setup](../../straddle-setup/SKILL.md). Print the `blocked` handoff and end the turn. When the developer says it is set, run this check again.

## Stated decisions

List what the developer already said, in their words, for each of these. Anything they did not say stays `unanswered`; do not fill it from the repository in this step.

- product: accept bank payments (Pay by Bank charges), send payouts, onboard businesses onto a platform (hosted onboarding), or a combination
- integration model: direct account, SaaS platform, or marketplace
- SDK language
- notification path: webhook endpoint (the default), FIFO endpoint, or polling endpoint
- whether an existing payment provider is being replaced

**Summary for step 2:** key and environment present, the stated decisions, and the unanswered list.
