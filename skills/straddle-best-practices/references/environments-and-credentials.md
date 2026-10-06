# Environments and credentials

## Environments

| Environment | Base URL | Use |
| --- | --- | --- |
| Sandbox | `https://sandbox.straddle.com` | All integration development and testing. The contract's default server. |
| Production | `https://production.straddle.com` | Live money movement. Never used by kit skills for writes. |

A key works only with its own environment. A Sandbox key sent to Production, or the reverse, fails authentication. Confirm which environment a key belongs to from the Straddle dashboard, not from its shape. The CLI selects the host with `STRADDLE_ENVIRONMENT` (`sandbox` or `production`) or an explicit `STRADDLE_BASE_URL`, and `straddle agent-context` reports the resolved URL offline as `runtime_context.environment`. That value falls back to Sandbox when nothing is set, so it is a resolved default, not proof that anyone selected an environment. Make the environment explicit, through one of those variables or the developer's confirmation, before any request.

The hosted API MCP installation is named `production` inside Scalar. That name says nothing about the Straddle environment a request reaches. Check the actual request target.

## Credentials

- Application code, the SDKs, and the CLI read the key from the process environment as `STRADDLE_API_KEY`. The plugin's API MCP declaration reads the same variable from the environment the client starts from, as described in [tools.md](tools.md). It never holds the key itself.
- Never open, print, copy, or summarize `.env*` files, credential stores, private keys, or the CLI's config files. Report whether a key is present, never its value. This covers commands and code you suggest to the developer too: do not propose `cat`, `awk`, `grep`, `dotenv`, or similar against a `.env*` file to inspect a key, even to print only its length or format. Use `straddle auth status --agent` for presence and the dashboard for the key's environment.
- A key check you run or suggest against the running process's `STRADDLE_API_KEY` reports only whether it is set, its length, and whether it has leading or trailing whitespace or a newline. It never prints any part of the key, such as a prefix, a suffix, or a slice.
- Never echo a key, include it in a log, plan, test fixture, commit, or chat message, or ship it in a browser bundle. Browser code talks to your server, and your server talks to Straddle.
- Do not export a key saved in the CLI to another tool.

## Missing configuration is an error

Every Straddle operation checks for a key and an environment before it sends anything. When either is missing, stop with a configuration error that names what is missing. Never return an empty result, skip the call, or report success. That rule covers application code, tests, CLI use, and skill reports alike.

Establish both offline before any request. `straddle auth status --agent` reports whether a key is configured, from the environment or saved CLI credentials, without sending a request or printing the key. `straddle doctor` is not an offline check: it sends `GET /` to the resolved host before reporting, and it exits 0 even when the key is missing.
