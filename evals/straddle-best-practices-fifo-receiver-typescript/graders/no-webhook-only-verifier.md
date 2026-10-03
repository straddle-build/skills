---
type: regex
target: { source: file, path: src/fifo.ts }
pattern: 'from\s+["'']standardwebhooks["'']|\.webhooks\.unwrap\('
match: not_contains
---
