---
type: regex
target: {source: file, path: straddle-audit-report.md}
pattern: '^## Findings\b(?:(?!^## )[\s\S])*?^\|(?=[^\n]*src/checkout\.ts:\d+)(?=[^\n]*\bpaykey)(?=[^\n]*\b(?:status|active|review|blocked|rejected)\b)'
flags: m
arm: with-only
---

The report's Findings table, not Checked and dismissed, has a row citing `src/checkout.ts:<line>` that names the paykey status the charge create never checks (ME-903, Audit P2).
