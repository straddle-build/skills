---
description: "Wizard program starting at Plan in a repository that uses Plaid Link with processor tokens only, no Plaid Transfer or Identity Verification (ME-947): Plaid is not a migration source, so Plan asks the bank connection as a decision with its two Plaid options, keeping Plaid tokens with createPlaidPaykey or moving Link to the Bridge widget, records it open, and writes no migration plan."
tags: [plan, decisions, interview, plaid, wizard-program]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---
Straddle Wizard program: straddle-plan → straddle-integrate → straddle-test → straddle-go-live. Start at straddle-plan.

Plan our Straddle integration for rent collection.
