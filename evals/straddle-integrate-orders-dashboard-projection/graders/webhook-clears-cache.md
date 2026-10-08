---
type: regex
target: { source: file, path: src/webhooks/straddle.mjs }
pattern: '\.\s*clear\s*\('
---

The webhook handler clears the customer's review-cache entry on its events.
