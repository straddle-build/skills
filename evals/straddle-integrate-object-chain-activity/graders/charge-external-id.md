---
type: regex
target: { source: file, path: src/straddle/payments.mjs }
pattern: 'nw-order-'
---

The charge create sends the approved `external_id`, `nw-order-<order.id>`.
