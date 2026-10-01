# Step 6: Review

- **Needs:** summaries from steps 3 to 5.
- **Tools:** Read, Grep; Bash for the repository's `git diff`/`git status` and test commands; Edit only on files changed in step 3.
- **Next:** [07-handoff.md](07-handoff.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-integrate","step":"06-review"}
```

Review only the files the step 3 summary lists, and the writes the step 5 summary lists. Check `git status` and confirm that every changed path is in the approved list and that no unrelated file was deleted or rewritten. Fix every item that fails:

- [ ] Changed files are exactly the approved ones, plus the plan's two approval lines if step 1 recorded an approval. Existing providers and unrelated code are byte-for-byte unchanged.
- [ ] No key, signing secret, token, or `.env` content appears in code, tests, fixtures, logs, or comments. Tests use synthetic values.
- [ ] Missing key or environment throws a configuration error before a request, and a test proves zero requests.
- [ ] The header rules match the integration type in every call, and the missing-account case fails locally with zero requests.
- [ ] Every create sends an idempotency key and an external ID. No recovery path loops on fresh creates.
- [ ] No code calls the API MCP's `execute-request`, and none of the fourteen excluded operations is routed anywhere but the SDK.
- [ ] Notification handling matches [Endpoint types](../../straddle-best-practices/references/receiving-webhooks.md#endpoint-types) for the plan's type: a webhook handler verifies the raw body with headers passed, fails on a missing secret, persists before `2xx`, and ignores duplicates; a FIFO handler does the same with the `svix-*` headers, parses the shape recorded from its endpoint's transformation, and stores each batch whole and in order before `2xx`; a polling consumer commits the last offset after storing each batch. Webhook and FIFO handlers verify with the `svix` library from [Verification library](../../straddle-best-practices/references/receiving-webhooks.md#verification-library), never a FIFO handler with an SDK `unwrap` or `Parsed` helper.
- [ ] No loop re-reads a resource for status. Dashboard email appears, if at all, only as a human confirmation.
- [ ] Onboarding uses the hosted iframe with `env=sandbox` and an external ID, with no React wrapper and no completion callback.
- [ ] Repository tests pass, or the failures are reported with their files.
- [ ] Every Sandbox write executed was in an approved preview row, with the previewed values.

**Summary for step 7:** checklist results and any item left failing.
