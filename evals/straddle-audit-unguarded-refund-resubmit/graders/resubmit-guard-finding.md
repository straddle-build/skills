---
type: regex
target: {source: file, path: straddle-audit-report.md}
pattern: '^## Findings\b(?:(?!^## )[\s\S])*?^\|(?=[^\n]*src/refunds\.ts:\d+)(?=[^\n]*\bresubmi)(?=[^\n]*\b(?:insufficient_funds|R01|R09|reason|guard|duplicate|already|twice|again|existing|once)\b)'
flags: m
arm: with-only
---

The report's Findings table, not Checked and dismissed, has a row citing `src/refunds.ts:<line>` for the resubmit that has no guard against a second resubmit or a return that can't be resubmitted (ME-903, Audit P3).
