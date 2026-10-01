---
description: "Python receiver for a plain webhook endpoint: webhook-* headers, svix or equivalent verification on the raw body, persist then 2xx."
tags: [best-practices, webhooks]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

We're a direct Straddle account. I created a webhook endpoint (not FIFO, not polling) in the Straddle Sandbox dashboard pointing at `https://shop.example.com/webhooks/straddle`, subscribed to charge.event.v1. Write the receiver in app/webhooks.py as a Flask blueprint mounted in app/main.py. Store each event with the store_event function in app/store.py. Don't create anything in Straddle.
