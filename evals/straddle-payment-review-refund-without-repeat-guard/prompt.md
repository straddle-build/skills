---
description: "Reports the owner-checked refund route with no guard against repeated or already-refunded submissions as a Critical or High finding at src/refunds.ts:line."
tags: [straddle-payment-review]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Straddle Wizard review: print the report; don't write files.
Use the straddle-payment-review skill on this repository. The session baseline is in `.straddle-wizard/session-baseline.json`.
