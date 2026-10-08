---
type: regex
target: {source: file, path: straddle-audit-report.md}
pattern: '^# Straddle audit\s*\nStatus: findings\b'
flags: m
arm: with-only
---

The report exists and its status is `findings`: the seeded defect keeps the audit from being `clean`.
