---
type: llm
focus: trace
arm: with-only
---

Look at the assistant's reply text in the trace, not the tool calls.

PASS if the reply shows the Test run's Sandbox preview as a Markdown table with numbered rows, each with an operation, executing tool, acting account or omitted header, payload summary, external ID and idempotency key, and, beside that table in the same reply, one small visual (a Mermaid sequence, call tree or similar inline sketch) of the requests as account A and account B, where the account header is sent or omitted, and how each status arrives, and every operation, row number, account, external ID, outcome and value the visual names also appears in that preview table or in the notification path the preview text names. The visual may abbreviate or leave out rows.
FAIL if there is no preview table, including when the run builds no preview because step 1 recorded a configuration error, no visual next to it, the visual replaces the table, or the visual names any operation, row, account, ID, external ID, sandbox outcome or other value that neither the preview table nor its stated notification path contains, such as an extra charge, a refund or payout the table lacks, a webhook when the preview names a FIFO endpoint, or a different account for a row. Also FAIL if the visual contains a key, token or paykey value.
