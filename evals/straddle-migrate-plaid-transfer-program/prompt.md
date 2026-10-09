---
description: "Wizard program starting at Migrate in a repository that moves money with Plaid Transfer (ME-947): Plaid is a migration source, so Migrate writes a migration plan that maps the Transfer debits to Straddle charges and the Transfer statuses to Straddle statuses, then stops for approval with an awaiting_approval report and starts no Integrate work."
tags: [straddle-migrate, plaid, wizard-program, approval]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Straddle Wizard program: straddle-migrate → straddle-integrate → straddle-test → straddle-go-live. Start at straddle-migrate.

We bill gym memberships with Plaid Transfer debits and want to move that to Straddle. We're a direct account, we'll use the TypeScript SDK and a Straddle webhook endpoint, and a PAYMENTS_PROVIDER setting should keep Plaid the default until we switch.

Straddle is configured here: `straddle auth status --agent` reported `authenticated: true` (source `env:STRADDLE_API_KEY`), and `printenv STRADDLE_ENVIRONMENT` printed `sandbox`.
