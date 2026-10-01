---
description: "Wizard program Setup then Plan: Setup finishes complete and Plan starts in the same run with no continue prompt, writes the plan, and stops for the developer's review with the approval still none."
tags: [setup, plan, wizard-program]
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---
Straddle Wizard program: straddle-setup → straddle-plan. Start at straddle-setup.

Decisions for the plan: we're a direct integration (our own Straddle account, no platform), members pay their dues with Pay by Bank charges, bank connection through Bridge with bank account details in Sandbox, the TypeScript SDK that's already installed, and status arrives through a Straddle webhook endpoint. Take your recommended answers for anything else you'd ask, and write the plan. Don't send any Straddle API request today.

I can't run shell commands here; this is what I ran locally:

`straddle --version`:

```text
straddle v1.0.3
```

`straddle auth status --agent`:

```json
{
  "authenticated": true,
  "config": "/home/dev/.config/straddle/config.toml",
  "source": "env:STRADDLE_API_KEY",
  "verified": false
}
```

`runtime_context` from `straddle agent-context`:

```json
{
  "environment": "https://sandbox.straddle.com",
  "integration_type": "account",
  "acting_account": null
}
```

`printenv STRADDLE_ENVIRONMENT`:

```text
sandbox
```

`printenv STRADDLE_BASE_URL`:

```text
(no output; exit status 1)
```
