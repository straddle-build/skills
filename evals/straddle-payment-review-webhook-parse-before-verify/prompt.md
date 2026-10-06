---
description: "Reports the webhook handler that parses and stores the event before verifying it, and skips verification without a secret, as Critical or High at src/webhooks.ts:line."
tags: [straddle-payment-review]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---
Straddle Wizard review: print the report; don't write files.
Use the straddle-payment-review skill on this repository.
Straddle Wizard review scope: .straddle-wizard/runs/eval/review-scope
