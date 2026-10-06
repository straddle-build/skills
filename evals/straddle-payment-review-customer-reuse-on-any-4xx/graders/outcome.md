---
type: llm
focus: last_message
---

PASS if the printed report's findings table has a Critical or High row at `src/customers.ts` whose impact and fix together show the reviewer found this defect: customer-create errors are recovered by status class (any 4xx) and an existing customer found by email is reused, says a refusal such as invalid input or a review decision becomes a successful customer (possibly someone else's), and fixes it by matching only the specific duplicate-customer refusal. Judge meaning, not wording.
FAIL if no Critical or High row describes this defect, if the row's impact or fix is empty, generic, or about a different problem, or if the row cites a different file.
