---
type: regex
target: { source: file, path: package.json }
pattern: '"@straddlecom/straddle"\s*:\s*"1\.0\.4"'
arm: with-only
---

After the run, package.json still declares the SDK at the exact version its install wrote (ME-918): the install's manifest change is kept, not reverted.
