# Step 2: Sources

- **Needs:** step 1 summary, and the Decisions log in `straddle-integration-plan.md`.
- **Tools:** Read, Glob, Grep; Bash only for `straddle which "<capability>" --agent` and `straddle <command> --help`; `straddle-docs` `search-documentation`; `straddle-api` `search-openapi-operations` and `summarize-openapi-specs`. No `execute-request`. No writes.
- **Next:** [03-write-plan.md](03-write-plan.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-plan","step":"02-sources"}
```

Step 1 read enough to ask nothing the repository answers. Now read what the plan must cite, in this order, and record where each fact came from.

1. **Repository.** What step 1 didn't read of the agent instructions, manifests, lockfiles, entry points, routes or handlers where payments belong, existing provider code, and tests. Find the test command.
2. **Installed SDK.** Open the selected SDK in the dependency tree (for example `node_modules/@straddlecom/straddle/`, the Python `site-packages/straddle/` package, the Ruby gem directory, the NuGet package, or the Go module cache). Read its `package.json`, `straddle-*.dist-info/METADATA`, or equivalent for the exact version, and whichever of `api.md`, README, and a generated agent skill the installed release ships for method names, client options, account-context options, idempotency options, and webhook helpers. The Python wheel ships its README only as the `METADATA` description. If the SDK is not installed yet, name the exact released version to add and mark every method name as `verify after install`.
3. **Straddle docs.** Use `search-documentation` on the Docs MCP for the product flow, sandbox outcomes, and the selected notification path. Use `search-openapi-operations` for request fields you cannot find in the SDK. These send no Straddle request.
4. **CLI help**, when the CLI is installed: `straddle which "<capability>" --agent` and `straddle <command> --help`, for sandbox helpers the plan will use later.

Do not copy method names, fields, or versions from memory. Anything you could not confirm goes into the plan as unresolved.

**Summary for step 3:** SDK package and exact version, the method for each planned operation with its source file, the verification library from [receiving-webhooks.md](../../straddle-best-practices/references/receiving-webhooks.md#verification-library) (the `svix` library, or an existing SDK webhook helper), repository files that will change, and the test command.
