---
type: regex
target: { source: file, path: src/straddle/payments.mjs }
pattern: '(?:\bmetadata\b[\s\S]*?){3}'
---

`metadata` appears at least three times: customer, paykey and charge each accept it, and the plan approved keys for all three.
