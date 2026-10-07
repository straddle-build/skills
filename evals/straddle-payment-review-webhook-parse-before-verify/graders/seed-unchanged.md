---
type: regex
target: {source: file, path: src/webhooks.ts}
pattern: 'const event = JSON\.parse\(req\.body\);'
arm: both
---
