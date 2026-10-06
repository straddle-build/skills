---
type: regex
target: {source: file, path: straddle-go-live-report.md}
pattern: '^## Payment review warnings\n(?:(?!## )[^\n]*\n)*?- Critical src/checkout\.ts:40\b[\s\S]*?- High src/checkout\.ts:39\b'
flags: m
---
