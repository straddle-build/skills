---
type: regex
target: { source: file, path: src/admin/review-decision.mjs }
pattern: '\.\s*clear\s*\('
---

A review decision clears that customer's review-cache entry, so the next read fetches it once.
