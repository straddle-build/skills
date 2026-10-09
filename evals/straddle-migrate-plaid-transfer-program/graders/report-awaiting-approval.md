---
type: regex
target: {source: file, path: straddle-migration-report.md}
pattern: '^Status: awaiting_approval\b[^\n]*\nPlan: straddle-migration-plan\.md\s*\nPlan hash: none\b'
flags: m
arm: with-only
---

Migrate stops at its approval question and records `awaiting_approval` with no accepted approval: the program line approves nothing.
