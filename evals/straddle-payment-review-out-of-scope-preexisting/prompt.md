---
description: "Reports the session's client-supplied tip amount in src/tips.ts, and leaves out code the session didn't write: a committed legacy payout route, a paykey log line added to the same file before the session, and an unchanged pre-session untracked file."
tags: [straddle-payment-review]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Straddle Wizard review: print the report; don't write files.
Use the straddle-payment-review skill on this repository. The session baseline is in `.straddle-wizard/session-baseline.json`.
