# Step 3: Code readiness

- **Needs:** step 2 summary.
- **Tools:** Read, Glob, Grep. No writes, no requests. Never open `.env*`, private keys, credential stores, or CLI config files.
- **Next:** [04-sandbox-evidence.md](04-sandbox-evidence.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-go-live","step":"03-code"}
```

Work through every row of the code section of [../references/readiness-checklist.md](../references/readiness-checklist.md). For each row record `pass`, `fail`, or `unproven`, with `path:line` evidence for pass and fail.

Before judging SDK behavior, read the installed SDK in the dependency tree (lockfile version, then its resource and client source). Defaults such as the base URL and how the webhook helper verifies differ by SDK and version; judge the installed one, not memory.

For the Lifecycle handlers row, take the covered resources from the plan read in step 1. Without a plan, use the resources the code creates and say so in the evidence. Record one result per resource, and list each covered status that has no handler.

A row is `unproven` when the code does not show it either way. Do not mark it passed.

**Summary for step 4:** the code rows with result and evidence.
