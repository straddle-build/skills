---
type: regex
target: { source: file, path: straddle-go-live-report.md }
pattern: '^\|(?=[^\n]*\bLifecycle handlers\b)(?=[^\n]*\|[\s*`]*fail[\s*`]*\|)(?=[^\n]*\bcancelled\b)'
flags: mi
arm: with-only
---

A checklist or blocking-gap row for Lifecycle handlers is `fail` and names `cancelled`, the charge status the plan covers and `src/lifecycle.ts` doesn't handle (ME-903, Go Live step 3).
