# Step 3: Hypotheses

- **Needs:** step 2 summary.
- **Tools:** Read, Glob, Grep. No writes, no requests.
- **Next:** [04-triage.md](04-triage.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-audit","step":"03-hypotheses"}
```

Run every check in [../references/checks.md](../references/checks.md) over the application code (not the dependency tree), and add hypotheses that explain the reported symptom. For each hit, write one hypothesis:

- `path:line` of the code
- the check ID and category (contract, account-scope, SDK, notification, safety, product model)
- what you believe is wrong and the behavior it would cause
- what in the installed SDK or contract would confirm or refute it

Keep hypotheses you are unsure of. Step 4 decides. Do not rank or fix anything yet.

The Product model checks (P1 to P4) look for something missing, so a missing handler, guard, or reconciliation is the hit. For each P check, cite the `path:line` of the code that needs it, such as the `paid` handler or the charge create. When the code doesn't show the handling either way, still write the hypothesis and say what's missing.

**Summary for step 4:** the hypothesis list.
