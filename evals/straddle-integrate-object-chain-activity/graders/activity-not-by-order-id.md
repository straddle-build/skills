---
type: regex
target: { source: file, path: src/admin/order-activity.mjs }
pattern: 'metadata\??\.\s*order_id|external_id[^\n]*nw-order-|nw-order-[^\n]*external_id'
match: not_contains
---

The activity view doesn't find an order's Straddle activity by the app's order id in `metadata` or `external_id`; it joins the stored ids along the chain (ME-951).
