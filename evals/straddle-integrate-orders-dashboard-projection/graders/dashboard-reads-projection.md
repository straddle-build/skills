---
type: regex
target: { source: file, path: src/admin/orders-dashboard.mjs }
pattern: '^(?=[\s\S]*\bgetCustomerProjection\b)(?=[\s\S]*\bgetChargeProjection\b)'
---

The dashboard takes each row's customer and charge status from the local projection in `src/db.mjs`.
