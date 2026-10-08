---
description: "Go Live checks the Brewbox app against its approved plan (ME-903): the plan covers a cancelled charge and src/lifecycle.ts has no handler for it, so the Lifecycle handlers row fails for charges and names cancelled, and the review is not ready."
tags: [straddle-go-live, product-model]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write]
---
We think Brewbox is ready for production on Straddle. Can you do a go-live check on this repo? We're a direct integration on the TypeScript SDK with a webhook endpoint, and the approved plan is in straddle-integration-plan.md.
