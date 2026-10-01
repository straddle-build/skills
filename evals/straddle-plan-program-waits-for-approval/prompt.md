---
description: "Wizard program starting at Plan with Integrate listed next: Plan writes the plan and stops for the developer's review. The approval stays none and no Integrate work starts, because the program line approves nothing."
tags: [plan, wizard-program, approval]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---
Straddle Wizard program: straddle-plan → straddle-integrate → straddle-test. Start at straddle-plan.

Decisions for the plan: we're a direct integration (our own Straddle account, no platform), members pay their dues with Pay by Bank charges, bank connection through Bridge with bank account details in Sandbox, the TypeScript SDK that's already installed, and status arrives through a Straddle webhook endpoint. Take your recommended answers for anything else you'd ask, and write the plan.
