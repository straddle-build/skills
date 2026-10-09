---
type: regex
target: {source: file, path: straddle-migration-plan.md}
pattern: '^## Current provider footprint\b(?:(?!^## )[\s\S])*?(?:\btransferCreate\b|/transfer/create\b)'
flags: m
arm: with-only
---

The migration plan's footprint lists the Plaid Transfer create call: Migrate treats the Transfer code as what it moves (ME-947).
