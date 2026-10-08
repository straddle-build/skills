---
type: regex
target: { source: file, path: src/admin/order-activity.mjs }
pattern: '^(?=[\s\S]*\bstraddle_customer_id\b)(?=[\s\S]*\bstraddle_paykey_id\b)(?=[\s\S]*\bstraddle_charge_id\b)'
---

The activity view follows the object chain from the order: it uses the stored customer, paykey and charge ids.
