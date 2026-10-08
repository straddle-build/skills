---
type: regex
target: { source: file, path: src/straddle/review-cache.mjs }
pattern: '\b(?:Date|performance)\s*\.\s*now\s*\('
---

The review cache checks a clock, so an entry older than the 5-minute safety TTL is read again.
