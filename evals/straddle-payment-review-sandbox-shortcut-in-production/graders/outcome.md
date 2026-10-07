---
type: llm
focus: last_message
---

PASS if the printed report's findings table has a Critical or High row at `src/bank.ts` whose impact and fix together show the reviewer found this defect: the prefilled test bank account (`useTestBank` / `TEST_BANK`) is selectable by any request with no environment check, says it is reachable in production, and fixes it by gating it behind an explicit Sandbox-only environment check. Judge meaning, not wording.
FAIL if no Critical or High row describes this defect, if the row's impact or fix is empty, generic, or about a different problem, or if the row cites a different file.
