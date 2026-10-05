# Step 4: Plan

- **Needs:** summaries from steps 2 and 3.
- **Tools:** Read. Write for `straddle-migration-plan.md` at the repository root only.
- **Next:** [05-approval.md](05-approval.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-migrate","step":"04-plan"}
```

When step 1 found a valid recorded approval, and steps 2 and 3 found nothing the plan doesn't already say (no new call site, file, answer, or `Unresolved` item, and no listed file changed since the plan), keep `straddle-migration-plan.md` byte for byte. Don't rewrite it, and go to step 5, which continues on that approval. Anything new means a refreshed plan, written as below, and the earlier approval no longer applies.

Write `straddle-migration-plan.md` from [../references/plan-template.md](../references/plan-template.md). Replace every placeholder with evidence, a developer answer, or `Unresolved`. Write `- Plan state: Draft`, or `Blocked` when an `Unresolved` item affects a listed file, and `- Approval: none`: a new or refreshed plan carries no approval until step 5 records one.

The **Authorized modifications** table is the contract for step 6. List every file to create or modify, one row each, with:

- the path
- `create` or `modify (additive)`
- what is added, in one sentence
- the flow and the step 2 call site it serves

Do not list a file with `delete`, `rename`, or `replace`; those are outside this skill. A modification row for a file that had uncommitted changes in the step 2 baseline is not allowed; list it under **Blocked** instead and ask the developer.

The plan must also fill, from the step 2 behavior list and step 3 answers:

- **Status mapping**: one row per provider status or event the code uses, mapped to a Straddle status and the application's own state. Use only the Straddle statuses listed in the template.
- **Returns, corrections, and retries**: `failed` vs `reversed` handling, who handles notifications of change, which codes may be retried, and how fatal-return accounts are blocked. For each idempotency key formula (create, resubmit, or retry), record its derivation and resulting length, prefix included; each must be 10 to 40 characters.
- **Consent**: the existing wording, the decision and who made it (or `Unresolved`), and `consent_type` per flow.
- **Bank accounts on the Straddle path** and **In-flight payments**, as the template states them.
- **Not moved**, in its own section: customer records, bank accounts, provider tokens, mandates and authorizations, and payment history.

Write nothing else in this step.

**Summary for step 5:** the plan path, the authorized-modification count, and open `Unresolved` items.
