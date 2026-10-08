---
description: "Plans a Paya Connect migration that maps status_id codes, splits charged-back debits into failed and reversed, and flags the TEL flow's consent."
tags: [straddle-migrate]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Move our Paya ACH payments to Straddle. We're a direct account, we use the TypeScript SDK, and we'll use a Straddle webhook endpoint.

Straddle is configured here: `straddle auth status --agent` reported `authenticated: true` (source `env:STRADDLE_API_KEY`), and `printenv STRADDLE_ENVIRONMENT` printed `sandbox`.
