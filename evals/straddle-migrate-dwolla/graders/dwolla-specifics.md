---
type: llm
focus: {source: file, path: straddle-migration-plan.md}
---

PASS if the plan (a) maps the household visit collections (Dwolla transfers from a household's bank to the business) to Straddle charges and the cleaner earnings (Dwolla transfers from the business to a cleaner's bank) to Straddle payouts, as separate operations, (b) maps Dwolla transfer statuses to Straddle payment statuses with `processed` to paid, `failed` before `processed` to failed, and a `failed` that arrives after `processed` to Straddle reversed, so `processed` is not treated as final, and (c) records a consent decision for Straddle-path payers, a new authorization or an explicit Unresolved item, because the existing on-demand authorizations name Dwolla.
FAIL if the plan treats one Straddle operation as covering both directions, maps every Dwolla `failed` to Straddle failed with no reversed case, says Dwolla's on-demand authorizations carry over to Straddle as they are, never mentions consent or authorization, or proposes an idempotency key format that is not guaranteed to be 10 to 40 characters (for example `visit-` plus an unrestricted visit ID, or `pay-` plus a payrun ID and a cleaner ID).
