---
description: Full marketplace plan with a polling endpoint, header rules, A/B proof, separate onboarding paths, and SDK/CLI routing for creates.
tags: [plan, marketplace]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Write our Straddle integration plan. Decisions: we're a marketplace platform, buyers pay sellers with Pay by Bank charges, bank connection through Bridge with bank account details in sandbox, TypeScript SDK (already installed), and we can't expose a public URL yet so notifications use a polling endpoint. Sellers onboard through Straddle's hosted onboarding. Take your recommended answers for anything else you'd ask, and write the plan. Don't create anything in Straddle yet.
