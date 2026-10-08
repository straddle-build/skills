---
type: llm
focus: {source: file, path: straddle-migration-plan.md}
---

PASS if the plan (a) maps the installment debits (`tokenizeddebit`) to Straddle charges and the loan disbursements (`tokenizedcredit`) to Straddle payouts, as separate operations, (b) maps Payliance statuses to Straddle payment statuses with 16 (Settled) to paid, 8 (Returned) to failed, 24 (Settled then Returned) to reversed, and 32 (Voided) to cancelled, so a return after settlement is not handled like a return before it, (c) learns Straddle payment outcomes from Straddle webhook events in place of the morning `querysettlements` and `queryreturns` job, which stays for installments still on Payliance, and (d) does not assume Payliance's refusal to debit accounts with earlier unauthorized or fatal returns carries over, and either says how the Straddle path stops debiting those accounts (what Straddle does, or a blocklist the application keeps) or records it as an explicit open item.
FAIL if the plan maps 8 and 24 to the same Straddle status, reads Straddle charges repeatedly to learn outcomes, assumes Payliance's return blocking still protects Straddle payments, sends Payliance's decimal dollar amounts to Straddle without converting them to integer cents, or proposes an idempotency key format that is not guaranteed to be 10 to 40 characters (for example `inst-` plus an unrestricted installment ID).
