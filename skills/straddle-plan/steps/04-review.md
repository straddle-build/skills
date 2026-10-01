# Step 4: Review

Print this marker once now, before any tool call, including ToolSearch or reading the next step, even when the review requires no edit:

```text
STRADDLE_PROGRESS {"skill":"straddle-plan","step":"04-review"}
```

- **Needs:** step 3 summary.
- **Tools:** Read, Grep, Edit on `straddle-integration-plan.md` only.
- **Next:** [05-handoff.md](05-handoff.md).

Read `straddle-integration-plan.md` from disk with the Read tool now, even if you just wrote it, and check that copy rather than your memory of it. Read nothing else. Fix every item that fails:

- [ ] Every Decisions row has an answer and a source, and none is still `open`. Each `Unresolved` row is also under Unresolved decisions, and each `assumption` is still marked as one.
- [ ] The plan uses each Glossary term the way the Glossary defines it. A refund is only the payout `refundCharge` creates, never a cancelled or reversed charge.
- [ ] Lifecycle handling covers every status the notification path delivers for each resource in scope, including `reversed` after `paid`, and names the decision behind each row.
- [ ] Each Sandbox scenario in Verification is a row of the Sandbox outcomes scenario matrix, and none expects a Sandbox payout, refund payouts included, to reach `paid`, `failed`, or `reversed`.
- [ ] No planned write uses `execute-request` for customer, paykey, charge, or payout creation, a `DELETE`, an unmask, or paykey reveal.
- [ ] Every planned operation is in the public API contract. Anything outside it, or with unclear contract or account scope, is removed and listed under unresolved decisions, with no SDK or CLI fallback.
- [ ] No status is discovered by repeating `GET` on a charge, payout, or list endpoint, and `straddle tail` is not a notification path.
- [ ] Dashboard email appears, if at all, only as a human confirmation.
- [ ] Header rules match [account-scope.md](../../straddle-best-practices/references/account-scope.md) for the integration type. Direct sends no account header. Marketplace customer, paykey, and Bridge calls omit it. SaaS customer, paykey, and Bridge creation require it. SaaS and marketplace charge and payout creation, refund, resubmit, and authorization upload require it. Other charge and payout reads and updates send it only when an account is selected.
- [ ] Every create has an idempotency key and an external ID. Each key scheme yields 10 to 40 characters, reuses the key for a retry of the same request, and gives each distinct write its own key, with no truncated raw IDs.
- [ ] Every future write has a preview and approval line and runs in Sandbox.
- [ ] No key, token, or `.env` content appears. The plan says keys come from `STRADDLE_API_KEY` in the environment.
- [ ] Missing key or environment is planned as a configuration error before any request.
- [ ] SDK method names cite the installed source or are marked `verify after install`.
- [ ] The SDK is one of the five published ones at the version in the best-practices table, and no retired release (such as PyPI `straddle` 0.x) is planned.

**Summary for step 5:** the checklist result and any items left unresolved.
