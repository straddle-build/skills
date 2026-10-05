# Step 6: Edit

- **Needs:** an approval recorded in the plan whose sha256 still matches the file, valid under [step 1](01-begin.md#scope): recorded by step 5, or by straddle-test.
- **Tools:** Read, Write, Edit on files in the approved table only. Bash for `git status --porcelain` and step 5's approval hash command. Never write or edit a file through the shell, such as `cat >>`, `sed -i`, `tee`, or a `python3` script.
- **Next:** [07-review.md](07-review.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-migrate","step":"06-edit"}
```

Before the first edit, run `git status --porcelain` again. If any approved file changed since the step 2 baseline, stop and ask.

Make the approved changes, one row at a time:

- Read the installed Straddle SDK in the dependency tree (its `api.md`, README, and resource source) before naming a method, parameter, or option. Do not write calls from memory or from another version's docs.
- Use only operations in the public Straddle API contract. If an SDK method, CLI command, or path is absent from the public contract or its scope is unclear, stop and resolve it against the public contract; do not fall back to the SDK, CLI, or MCP for it.
- Put Straddle calls behind the approved switch. The existing provider path stays the default unless the plan says otherwise, and keeps working unchanged.
- Read the API key and environment from the application's configuration and fail with a configuration error that names the missing value before any request. Do not rely on an SDK default environment.
- Apply account scope for the chosen model through the SDK's own parameter. Send an idempotency key of 10 to 40 characters and a stable external ID on every create.
- Implement each status mapping table in the plan as one explicit translation for its resource. For payments: from Straddle payment statuses to the application's states, covering all nine, with `failed` and `reversed` kept distinct and the return code carried through. For identity: from Straddle customer statuses to the application's states, covering all five (`pending`, `review`, `verified`, `rejected`, `inactive`), including a `review` customer later decided `verified` or `rejected`. Do not reuse the provider's status names for Straddle resources, and never route a customer status through the payment translation.
- For payment flows, implement return and correction handling as the plan states it. Do not assume the old provider's automatic corrections or account blocking carry over. Rely on Straddle behavior only where the plan cites a Straddle source for it.
- For payment flows, capture authorization on the Straddle path as the consent decision states, and send the matching `consent_type`.
- Implement the chosen notification path per [receiving-webhooks.md](../../straddle-best-practices/references/receiving-webhooks.md). Do not port a provider status-polling loop, report query, or return-file poller onto Straddle resource reads.
- Add tests beside the existing ones for each new path, using the repository's test style and no real key. Status-mapping tests cover every row of each mapping table: for payments including `failed` vs `reversed`, and for identity fed recorded `customer.event.v1` payloads. An identity-only migration adds no payment tests.

If a change turns out to need a file or kind of change not in the table, stop, update the plan, and return to step 5.

**Summary for step 7:** files touched, tests added, and the plan hash checked before the first edit.
