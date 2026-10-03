---
type: regex
target: { source: file, path: straddle-plan-visual.html }
pattern: '<script[^>]*\ssrc\s*=\s*["'']?(?:https?:)?//|<link[^>]*\shref\s*=\s*["'']?(?:https?:)?//|@import\s+(?:url\(\s*)?["'']?(?:https?:)?//|url\(\s*["'']?(?:https?:)?//|<iframe[^>]*\ssrc\s*=\s*["'']?(?:https?:)?//'
flags: i
match: not_contains
arm: with-only
---
