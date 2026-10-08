---
description: "Plans a Dwolla migration that splits collections and payouts, maps a failure after processed to reversed, and asks for new authorizations."
tags: [straddle-migrate]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Move our Dwolla payments to Straddle. We're a direct account, we use the TypeScript SDK, and we'll use a Straddle webhook endpoint.

Straddle is configured here: `straddle auth status --agent` reported `authenticated: true` (source `env:STRADDLE_API_KEY`), and `printenv STRADDLE_ENVIRONMENT` printed `sandbox`.
