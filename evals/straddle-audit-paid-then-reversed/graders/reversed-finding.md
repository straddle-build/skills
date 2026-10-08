---
type: regex
target: {source: file, path: straddle-audit-report.md}
pattern: '^## Findings\b(?:(?!^## )[\s\S])*?^\|(?=[^\n]*src/lifecycle\.ts:\d+)(?=[^\n]*\breversed\b)'
flags: m
arm: with-only
---

The report's Findings table, not Checked and dismissed, has a row citing `src/lifecycle.ts:<line>` that names the missing `reversed` handling: the app ships on `paid` and does nothing when a paid charge is returned (ME-903, Audit P1).
