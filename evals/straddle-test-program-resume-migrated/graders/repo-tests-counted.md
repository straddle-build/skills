---
type: regex
target: { source: file, path: straddle-test-evidence.md }
pattern: '(?<![\w.-])15(?![\w.-])\s*(?:/\s*15\s*|of\s+15\s+)?(?:tests?|passed|pass(?:ing|es)?)\b|\b(?:tests?|pass(?:ed)?)\b[^\n\d]{0,12}(?<![\w.-])15(?![\w.-])|npm test[^\n]*(?<![\w.-])15(?![\w.-])|(?<![\w.-])15(?![\w.-])[^\n]*npm test'
flags: i
arm: with-only
---

The evidence reports the repository test count that only running `npm test` gives (ME-920). The scaffold's `test/straddle.test.mjs` makes 15 tests at run time from five `test(` calls, two of them in loops, and the migration report says `npm test`: 4 passed. So a count read from the source (5) or copied from the migration report (4) fails, and only the executed count, 15, passes, next to a test or pass word or on the line that names `npm test`.
