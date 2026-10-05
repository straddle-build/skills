# Step 4: Sandbox evidence

- **Needs:** step 3 summary and any evidence files from step 1.
- **Tools:** Read, Glob. No requests, no writes.
- **Next:** [05-production-setup.md](05-production-setup.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-go-live","step":"04-sandbox-evidence"}
```

Check the Sandbox section of [../references/readiness-checklist.md](../references/readiness-checklist.md) against evidence produced by [straddle-test](../../straddle-test/SKILL.md) or the repository's own tests. Evidence means recorded results from this code: statuses, return codes, request counts, and the notification deliveries that carried them.

Say how you know each result. "No test files found" by reading the repository is not the same as a test run. Report a command's output, such as `npm test` passing or finding nothing, only if you ran that command in this session and saw the output.

Go Live does not run Sandbox writes to fill a gap. A missing proof is `unproven`, and the report sends the developer to straddle-test.

A Bridge widget row Test recorded `not run: needs the widget completed in a browser` is an `unproven` gap: name it in the report, even when Test passed.

**Summary for step 5:** the Sandbox rows with result and evidence.
