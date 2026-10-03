---
description: "Go consumer for a polling endpoint: Bearer polling token, no signature to verify, store then commit the last offset."
tags: [best-practices, webhooks, polling]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

We're a direct Straddle account and can't expose a public URL, so I created a polling endpoint in the Straddle Sandbox dashboard. Its consumer URL is in STRADDLE_POLLING_URL and its token in STRADDLE_POLLING_TOKEN. Write the consumer in consumer/consumer.go (package consumer) as a function Run(ctx context.Context, store Store) error, where Store is the interface in consumer/store.go. Make sure events are authentic before storing them. Don't create anything in Straddle.
