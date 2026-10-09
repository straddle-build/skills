---
type: regex
target: {source: file, path: straddle-migration-plan.md}
pattern: '^\|[^\n]*\bfunds_available\b[^\n]*\|[^\n]*\bpaid\b'
flags: m
arm: with-only
---

The plan's status mapping has a row that maps Plaid Transfer's `funds_available` to Straddle `paid`.
