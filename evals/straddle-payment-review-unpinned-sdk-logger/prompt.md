---
description: "Reports the SDK client built with a redacting fetch logger but no pinned SDK log level as a Critical or High finding at src/straddle.ts:line."
tags: [straddle-payment-review]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Straddle Wizard review: print the report; don't write files.
Use the straddle-payment-review skill on this repository. The session baseline is in `.straddle-wizard/session-baseline.json`.
