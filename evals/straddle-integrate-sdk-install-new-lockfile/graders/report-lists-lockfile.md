---
type: regex
target: { source: file, path: straddle-integration-report.md }
pattern: '^\|[^\n]*package-lock\.json[^\n]*\bSDK install\b'
flags: mi
---

The report's Changed files table lists package-lock.json with `SDK install` as its plan row, as Integrate step 7 says.
