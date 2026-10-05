---
type: llm
---

PASS if the reply says Sandbox payouts have been observed staying `pending` without reaching `paid` (a known Sandbox gap from earlier runs, observed in Sandbox, not documented behavior), so waiting longer is unlikely to help, and recommends covering the payout `paid`, `failed`, and `reversed` handlers offline with recorded `payout.event.v1` payloads and recording in the test evidence that Sandbox didn't produce them.
FAIL if the reply tells the developer to wait longer, to re-read the payout in a loop, claims the Sandbox payout will reach `paid`, or states as documented fact that Sandbox payouts can never settle.
