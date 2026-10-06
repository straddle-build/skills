---
type: llm
focus: last_message
---

PASS if the printed report's findings table has a Critical or High row at `src/webhooks.ts` whose impact and fix together show the reviewer found this defect: webhook verification runs on a text-decoded body (`express.text`) instead of the exact raw bytes, says signatures can fail or be checked over altered bytes (invalid UTF-8 is replaced before verification), and fixes it by passing the raw bytes (`express.raw`) to verification. Judge meaning, not wording.
FAIL if no Critical or High row describes this defect, if the row's impact or fix is empty, generic, or about a different problem, or if the row cites a different file.
