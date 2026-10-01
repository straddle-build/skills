---
type: llm
focus: { source: file, path: straddle-integration-plan.md }
arm: with-only
---

PASS if the plan keeps the Decisions log's answers with their sources (Q1 to Q13, plus the Customer phone and Balance check rows) and the Glossary's Member and Dues terms; its customer create sends phone and its charge create sets balance_check to enabled; its Lifecycle handling section says what the app does for the dues charge on paid, on failed, and on reversed after paid (dues marked unpaid again, the member emailed, one resubmit for R01 or R09 only), plus customer review and the paykey review and R29 block; and its Verification lists Sandbox scenarios from the Sandbox outcomes matrix, including the happy path with a paid charge and the return after paid with reversed_insufficient_funds and a funding simulation or sweep.
FAIL if the plan changes or drops a decision, plans a refund through Straddle, expects a Sandbox payout to reach paid, failed, or reversed, or has no Lifecycle handling for reversed after paid.
