---
description: "Reports the route that accepts a browser-posted paykey without checking it belongs to the order's customer as a Critical or High finding at src/bank.ts:line."
tags: [straddle-payment-review]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---
Straddle Wizard review: print the report; don't write files.
Use the straddle-payment-review skill on this repository.
Straddle Wizard review scope: .straddle-wizard/runs/eval/review-scope
