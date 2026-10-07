---
type: llm
focus: last_message
---

PASS if the printed report's Critical or High rows at `src/customers.ts`, read together, show the reviewer found this defect: when the customer create fails, the code recovers on a status class (any 4xx) instead of the specific refusal; the impact is that a refused create, such as invalid input or a review decision, comes back as a successful customer; and the fix is to recover only on the specific duplicate-customer refusal and return other errors. The mechanism, impact and fix may be split across several related rows. Rows about the email lookup returning someone else's customer, or about a missing environment check, are fine extra findings. Judge meaning, not wording.
FAIL if no Critical or High row at `src/customers.ts` names recovery keyed on a status class (any 4xx), even if other rows report the email reuse, a cross-customer lookup, or a Sandbox shortcut; or if the impact or fix for it is missing, generic, or about a different problem.
