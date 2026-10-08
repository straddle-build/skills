---
type: regex
target: { source: file, path: src/straddle/payments.mjs }
pattern: 'nw-user-'
---

The customer create sends the approved `external_id`, `nw-user-<user.id>`.
