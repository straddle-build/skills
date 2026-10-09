---
description: "Approved plan with an order activity view and approved identifiers (ME-951): every create sends the plan's external_id and metadata values, and the view finds an order's Straddle calls and events by the stored customer, paykey and charge ids, not by the order id."
tags: [integrate, direct, code, object-chain, grant-write-edit]
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---
Our Straddle integration plan is approved. Implement it in the code, including the order activity page our support team uses to see every Straddle call for an order. Don't set anything up in the Straddle sandbox yet.
