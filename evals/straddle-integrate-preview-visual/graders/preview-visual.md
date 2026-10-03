---
type: llm
focus: trace
arm: with-only
---

Look at the assistant's reply text in the trace, not the tool calls.

PASS if the reply shows the Straddle Sandbox preview as a Markdown table with numbered rows, each with an operation, executing tool, acting account or omitted header, payload summary, external ID and idempotency key, and, beside that table in the same reply, one small visual (a Mermaid diagram, call tree or similar inline sketch) of those rows, and every operation, row number, account, external ID, ID and value the visual names also appears in that preview table. The visual may abbreviate or leave out rows.
FAIL if there is no preview table, no visual next to it, the visual replaces the table, or the visual names any operation, row, account, ID, external ID, outcome or other value that the preview table does not contain, such as an extra create, a webhook or FIFO registration, a refund or payout the table lacks, or a different account for a row. Also FAIL if the visual contains a key, token or paykey value.
