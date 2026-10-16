# Step 2: Context

- **Needs:** step 1 summary.
- **Tools:** Read, Glob, Grep. Bash for `command -v straddle`, `straddle --version`, `straddle auth status --json`, and `straddle agent-context`, which read local configuration and send nothing. Docs MCP `search-documentation`. API MCP `summarize-openapi-specs` and `search-openapi-operations`, which send no Straddle request. `straddle doctor` and any API read only under the rule below, because both reach the API host. No writes.
- **Next:** [03-hypotheses.md](03-hypotheses.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-audit","step":"02-context"}
```

Gather, sanitized:

1. **Installed SDK.** Package name and resolved version from the lockfile, and the path to its installed source in the dependency tree (for example `node_modules/@straddlecom/straddle/`, the Go module cache path from `go env GOMODCACHE`, `bundle info straddle`, or the NuGet package folder). Step 4 reads this source. If the dependency tree is not installed, say so; triage will be limited to the lockfile and published docs and confidence drops accordingly.
2. **Contract.** The contract version the SDK was generated from (its manifest or README) and the operations involved in the symptom, from `search-openapi-operations` or the published API reference.
3. **Runtime, offline.** Credential presence and its source from `straddle auth status --json` (`authenticated`, `source`; it covers `STRADDLE_API_KEY` and a key saved in the CLI configuration, never shows the value, and sends nothing). The environment the developer states. The host the CLI resolves from `straddle agent-context` (`runtime_context.environment` falls back to Sandbox when nothing is configured, so it is a resolved default that can confirm the developer's statement but never replaces it), plus integration type and acting account when reported. When the CLI is absent, or the credential that matters is the API MCP client's or a deployment's, ask the developer and record the answer as developer-confirmed or `unknown`. Never read `.env*` or the CLI config file. The same limits apply to steps you suggest the developer run: never point them at the key's value or a `.env*` file, even to look for stray quotes or whitespace (a check may report only whether the running process's `STRADDLE_API_KEY` is set, its length, and whether it has surrounding whitespace or quotes), and never ask them to resend or reproduce a request until the credential and environment are established as the Optional read below requires.
4. **Request evidence.** Status code, error type, `Request-Id`, `Correlation-Id`, and the resource ID from the developer's logs. Remove secrets and PII before quoting.

**Optional read.** Only after the credential is present (by `auth status` or developer confirmation) and the developer has stated the environment may anything reach Straddle, including `straddle doctor`, which sends a request to the API host before it checks credentials. If a resource's current state would confirm a hypothesis (for example a charge's status and status history), show the exact read, host, and account scope, and run it once after the developer says yes. Use a permitted GET through `execute-request` or the CLI with `--agent --data-source live`. Never an unmask or reveal operation. When the credential is missing or unknown, or the environment is unstated, record `Configuration error: <what is missing>. No Straddle request was sent.` and continue without it. When the credential is missing, the fix is the developer's: set `STRADDLE_API_KEY` in their own shell or deployment secrets, or save a key with `straddle auth set-token` (`straddle auth setup` prints how to obtain one). Name only subcommands that appear in the installed CLI's `straddle auth --help`, and never ask for the key in chat.

**Summary for step 3:** installed SDK and its source path, contract version, runtime facts, sanitized request evidence.
