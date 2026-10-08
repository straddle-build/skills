---
type: llm
focus: {source: file, path: straddle-migration-plan.md}
---

PASS if the plan (a) maps the Paya `debit` transactions to Straddle charges (the phone payment flow may instead stay on Paya until its consent is decided) and handles the full `refund` of a settled debit as a separate operation, a Straddle payout or an explicit Unresolved item, (b) maps Paya `status_id` values to Straddle payment statuses with 131, 132, and 133 to pending, 134 to paid, 136 and 301 to failed, 201 to cancelled, and 331 (Charged Back) split by timing: failed when it arrives before 134 and reversed when it arrives after 134, (c) gives the online dues flow (`ach_sec_code` WEB) `consent_type` internet and flags the phone flow (`ach_sec_code` TEL) as having no matching `consent_type` value, needing a decision or marked Unresolved, and (d) learns Straddle payment outcomes from Straddle webhook events in place of the Paya postback route and the nightly charged-back poll, which stay for transactions still on Paya.
FAIL if the plan maps 331 to only one Straddle status regardless of settlement, gives the TEL flow `internet` or `signed` without flagging it, treats a refund as a charge, reads Straddle charges repeatedly to learn outcomes, or proposes an idempotency key format that is not guaranteed to be 10 to 40 characters (for example `dues-` plus an unrestricted member ID and period).
