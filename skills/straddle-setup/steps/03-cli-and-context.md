# Step 3: CLI, key presence, and runtime context

- **Needs:** step 2 summary.
- **Tools:** Bash for the commands in the allowlist below only. If you cannot run commands, ask the developer to run the offline commands and paste the output.
- **Next:** [04-mcp.md](04-mcp.md).

Print this once, right after reading this file and before any other tool call or the next step file, even when the developer already pasted the command output and you run no command:

```text
STRADDLE_PROGRESS {"skill":"straddle-setup","step":"03-cli-and-context"}
```

Establish the key, environment, and context offline first. Nothing in the offline phase sends a request. Network checks come only after every prerequisite holds.

## Command allowlist

Offline phase, in this order. A non-zero exit from `auth status` is a finding, not a reason to stop the offline phase:

```bash
command -v straddle
straddle --version
straddle auth status --agent
straddle agent-context
printenv STRADDLE_ENVIRONMENT
printenv STRADDLE_BASE_URL
```

Network phase, only under "Network checks" below:

```bash
straddle doctor --agent --data-source live
straddle accounts list --agent --data-source live
```

Run nothing else. Never print `STRADDLE_API_KEY` or any other secret variable. If `command -v straddle` finds nothing, skip the rest of this step and record the CLI as missing. If a command is not in the installed CLI's `--help`, record its result as unknown.

## Key presence: `straddle auth status --agent`

It reads the CLI's configuration locally and sends no request. It covers both an environment variable and a key saved with the CLI, so do not assume `STRADDLE_API_KEY` is the only source.

| Output | Result |
| --- | --- |
| `authenticated: true` | Key present, `verified: false`. Report the source only as its category (`env:STRADDLE_API_KEY` or saved CLI credentials). Never copy the `config` path or any value. |
| `authenticated: false`, or a non-zero exit with `no credentials configured` | **Blocking configuration failure: no API key.** |

## Context: `straddle agent-context`

It sends no request and does not open the local store. Read only its `runtime_context`.

| Field | Result |
| --- | --- |
| `environment` | The URL the CLI would use. It resolves to `https://sandbox.straddle.com` by default when nothing is set, so it does not prove the developer selected an environment. |
| `integration_type` | `account` (direct), `saas`, or `marketplace`. `null` is unknown: ask the developer, and do not infer it from the code. |
| `acting_account` | Required for SaaS customer, paykey, and Bridge creation, and for SaaS and marketplace charge and payout creation. `null` on a platform is a warning for Setup and a blocker for Integrate. |
| `error` | Blocking. Quote it. |
| `runtime_context` absent | The CLI predates v1.0.3, which also means its creates cannot send `--idempotency-key`. Warning. Take integration type and acting account from the developer and label them developer-stated. |

## Explicit environment

The environment is explicitly selected only when one of these holds:

- `printenv STRADDLE_ENVIRONMENT` prints `sandbox`, or `printenv STRADDLE_BASE_URL` prints `https://sandbox.straddle.com` (an unset variable prints nothing and exits 1)
- the developer confirms in this run that the target is Sandbox, and `runtime_context.environment` is `https://sandbox.straddle.com` (label it developer-confirmed)

A resolved default with no confirmation is a **blocking configuration failure: environment not explicitly selected**. Any environment other than `https://sandbox.straddle.com` is blocking, because integration proofs run in Sandbox.

## Network checks

`straddle doctor` sends `GET /` to the resolved host, with the key header when one is configured, before it reports anything. `straddle accounts list` is a permitted authenticated read that sends no `Straddle-Account-Id`. Neither is part of the offline preflight.

Offer them only when every prerequisite holds:

- the CLI is present
- `auth status` reports the key as present
- the environment is explicitly selected and is `https://sandbox.straddle.com`
- `runtime_context.error` is absent

If any prerequisite fails, do not offer or run either command, even if the developer asks. Report both as `not run (prerequisite failed: <which>)`. When the prerequisites hold, open the offer with one plain sentence that says what you're offering, before any table or list, for example "The CLI, key, and Sandbox environment are set, so I can run two Sandbox reads next." Tell the developer each command sends a request to Sandbox, and run it only after they say yes; report `not run (declined)` otherwise.

- **`doctor`:** `api` reachable is `passed`. `api` unreachable is blocking. Its `credentials` field says `present, not verified`, which is not verification.
- **`accounts list`:** accounts returned is `passed`. A 401 or 403 is `failed`, which is blocking. For a platform, the result also shows whether at least two Sandbox accounts exist for the A/B fixture.

Never report either as passed unless it ran in this run.

**Summary for step 4:** CLI version or missing, key presence and source category, environment and whether it was explicitly selected (env var or developer-confirmed), integration type and its source, acting account, whether the network prerequisites held, reachability and authenticated check results (`passed`, `failed`, or `not run` with reason), and Sandbox account count when known.
