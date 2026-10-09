---
type: regex
target: {source: file, path: straddle-migration-plan.md}
pattern: '^## Flows in scope\b(?:(?!^## )[\s\S])*?(?:\bcharges\.create\b|\bcreateCharge\b|POST /v1/charges\b)'
flags: m
arm: with-only
---

The plan's Flows in scope moves the membership debit to a Straddle charge, as the Plaid provider reference maps a Transfer debit.
