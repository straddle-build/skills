---
type: regex
target: {source: file, path: src/refunds.ts}
pattern: 'Idempotency-Key": `refund-\$\{order\.id\}-\$\{Date\.now\(\)\}`'
arm: both
---
