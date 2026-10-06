---
description: "Go Live lists the current payment review's open Critical and High findings as warnings and still reports ready when every required row passes."
tags: [straddle-go-live]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Bash]
---
Straddle Wizard program: Go Live. Test passed and the payment review is saved. Run the go-live check on this repo.

We're a direct integration on the TypeScript SDK, going to production. The Straddle CLI isn't installed here. The production key is in our deployment's secret manager as STRADDLE_API_KEY, and STRADDLE_BASE_URL is set to https://production.straddle.com there. For the dashboard items: the production key was issued in the production dashboard and stored in the secret manager; the production webhook endpoint exists, subscribed to charge events, with its own signing secret stored server-side; endpoint failure alerts go to our on-call email; dashboard email recipients are set. No production reads needed.
