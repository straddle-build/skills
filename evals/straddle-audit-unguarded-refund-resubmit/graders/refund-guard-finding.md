---
type: regex
target: {source: file, path: straddle-audit-report.md}
pattern: '^## Findings\b(?:(?!^## )[\s\S])*?^\|(?=[^\n]*src/refunds\.ts:\d+)(?=[^\n]*\brefund(?!s\.ts))(?=[^\n]*\b(?:guard|duplicate|already|twice|again|existing|once|paid)\b)'
flags: m
arm: with-only
---

The report's Findings table, not Checked and dismissed, has a row citing `src/refunds.ts:<line>` for the refund that has no guard against a second refund or an unpaid charge (ME-903, Audit P3). The row must name the refund itself: `refunds.ts` in a resubmit row's path doesn't count.
