---
type: regex
target: trace
pattern: 'Connection error\.|dial tcp [^\s"\\]+: connect|ECONNREFUSED|fetch failed'
match: not_contains
arm: both
---
