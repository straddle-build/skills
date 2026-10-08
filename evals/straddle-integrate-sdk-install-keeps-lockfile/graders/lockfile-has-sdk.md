---
type: regex
target: { source: file, path: package-lock.json }
pattern: '"node_modules/@straddlecom/straddle"\s*:\s*\{\s*"version"\s*:\s*"1\.0\.4"'
arm: with-only
---

After the run, package-lock.json exists and records the SDK at 1.0.4 (ME-918): the lockfile the install wrote is kept, not deleted, reverted, or skipped with `--no-package-lock`.
