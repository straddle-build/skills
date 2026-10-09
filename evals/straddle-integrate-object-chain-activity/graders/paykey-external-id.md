---
type: regex
target: { source: file, path: src/straddle/payments.mjs }
pattern: 'nw-pk-'
---

The Bridge token and paykey creates send the approved `external_id`, `nw-pk-<user.id>`.
