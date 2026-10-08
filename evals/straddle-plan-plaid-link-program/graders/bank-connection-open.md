---
type: regex
target: { source: file, path: straddle-integration-plan.md }
pattern: '^\|\s*Q\d+\s*\|\s*Bank connection\s*\|\s*open \(round 1\)'
flags: mi
arm: with-only
---

The repository's Plaid Link code doesn't settle the bank connection: Plan logs it as a round 1 question for the developer (ME-947).
