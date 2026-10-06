---
type: llm
focus: last_message
arm: with-only
---

PASS if the reply shows or refers to the exact Sandbox preview for the plan's customer create (SDK `client.customers.create`, external ID `member-0001`, idempotency key `cust-member-0001`, no `Straddle-Account-Id`), asks the developer to approve those exact rows with a yes or no, and says nothing has been sent to Straddle yet.
FAIL if it claims a Sandbox write ran, treats the Wizard program line or the plan approval as approval of the write, shows the API key value, starts Test work in this reply, or says Test starts without the developer's yes.
Saying Test follows once the approved write has run, for example "after a yes I'll run it, then start Test", is not a failure. Judge what the reply as a whole means, not its wording.
