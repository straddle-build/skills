---
type: llm
focus: last_message
---

PASS if the printed report's findings table has a Critical or High row at `src/webhooks.ts` whose impact and fix together show the reviewer found this defect: the webhook handler parses and stores the event before verifying its signature and skips verification when the secret is unset, says forged events get stored, and fixes it by verifying the raw body first and failing closed when the secret is missing. Judge meaning, not wording.
FAIL if no Critical or High row describes this defect, if the row's impact or fix is empty, generic, or about a different problem, or if the row cites a different file.
