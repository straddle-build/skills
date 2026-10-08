---
type: regex
target: {source: file, path: straddle-audit-report.md}
pattern: '^## Findings\b(?:(?!^## )[\s\S])*?^\|(?=[^\n]*src/lifecycle\.ts:\d+)(?=[^\n]*\bfunding)'
flags: m
arm: with-only
---

The report's Findings table, not Checked and dismissed, has a row citing `src/lifecycle.ts:<line>`, where the ledger is marked settled at `paid`, that names the missing funding-event reconciliation (ME-903, Audit P4).
