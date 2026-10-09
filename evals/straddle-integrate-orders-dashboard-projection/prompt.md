---
description: "Approved plan with a back-office orders dashboard polled every 3 seconds (ME-954): the dashboard renders from the local projection and reaches no Straddle read itself, the review cache expires on a clock, and both the webhook handler and review decisions clear it."
tags: [integrate, direct, code, read-strategy, grant-write-edit]
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---
Our Straddle integration plan is approved. Implement it in the code, including the back-office orders dashboard: it lists every order with its customer status and charge status, and the page refreshes every 3 seconds. Don't set anything up in the Straddle sandbox yet.
