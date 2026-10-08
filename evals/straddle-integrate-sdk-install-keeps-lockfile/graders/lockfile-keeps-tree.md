---
type: regex
target: { source: file, path: package-lock.json }
pattern: '"node_modules/ms"\s*:\s*\{\s*"version"\s*:\s*"2\.1\.3"'
arm: with-only
---

The developer's existing lockfile keeps its pinned tree: `ms` stays at 2.1.3 beside the SDK the install added (ME-918).
