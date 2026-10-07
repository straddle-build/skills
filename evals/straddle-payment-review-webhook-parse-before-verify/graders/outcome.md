---
type: llm
focus: last_message
---

PASS if the printed report's Critical or High rows at `src/webhooks.ts`, read together, show the reviewer found this defect: the webhook handler parses the event and stores it (`saveEvent`) before verifying its signature, and skips verification when the secret is unset; the impact is that forged events get stored or accepted; and the fix is to verify the raw body first and fail closed when the secret is missing. Both halves (the event stored before its signature is verified, and skipped verification without a secret) must be reported, each with its impact and fix, but they may be split across several related rows. Judge meaning, not wording.
FAIL if no Critical or High row at `src/webhooks.ts` says the handler stores or acts on the event before verifying its signature (a row only about a body parser that loses the raw bytes or rejects real deliveries doesn't count), or none names the skipped verification when the secret is unset; or if the impact or fix for either is missing, generic, or about a different problem.
