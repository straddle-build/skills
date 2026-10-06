# Step 1: Begin

- **Needs:** the developer's request.
- **Tools:** Read, Glob. No shell commands, no MCP calls, no writes.
- **Next:** [02-configuration.md](02-configuration.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-go-live","step":"01-begin"}
```

Read [straddle-best-practices](../../straddle-best-practices/SKILL.md) and keep its rules in force.

If the request includes a production write ("run a live charge", "create our production webhook", "delete the test customers in prod"), decline that part in one sentence, say why, and continue with the review. Record the declined request for the report.

Record what the developer stated: integration model, SDK, notification path, and any pasted `straddle doctor` or test output. Look for `straddle-integration-plan.md` or `straddle-migration-plan.md`, Sandbox evidence written by straddle-test (`straddle-test-evidence.md`), the payment review written by [straddle-payment-review](../../straddle-payment-review/SKILL.md) (`straddle-payment-review.md`), `.straddle-wizard/session-baseline.json`, and CI configuration, and read them if present. Earlier evidence is input, not proof of the current code.

**Summary for step 2:** stated facts, declined requests, evidence files found.
