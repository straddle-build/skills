---
description: "Plans a Payliance migration that maps its numeric statuses, replaces return and settlement polling with Straddle events, and doesn't assume Payliance's return blocks carry over."
tags: [straddle-migrate]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Move our Payliance ACH to Straddle. We're a direct account, we use the TypeScript SDK, and we'll use a Straddle webhook endpoint.

Straddle is configured here: `straddle auth status --agent` reported `authenticated: true` (source `env:STRADDLE_API_KEY`), and `printenv STRADDLE_ENVIRONMENT` printed `sandbox`.
