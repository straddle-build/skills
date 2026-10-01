---
description: "TypeScript receiver for a FIFO endpoint: svix-* headers verified with the svix library, the {data:[{payload,eventType}]} batch stored whole and in order."
tags: [best-practices, webhooks, fifo]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

We're a SaaS platform on Straddle. I created a FIFO endpoint in the Straddle Sandbox dashboard pointing at `https://api.example.com/webhooks/straddle/fifo`, with the dashboard's default transformation, subscribed to charge.event.v1 and payout.event.v1. We haven't captured a delivery yet, so build for what Straddle's Sandbox FIFO endpoints send. Write the Express route in src/fifo.ts and register it in src/server.ts. Store events with saveEvents from src/store.ts. Don't create anything in Straddle.
