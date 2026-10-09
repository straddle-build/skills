---
type: regex
target: { source: file, path: straddle-go-live-report.md }
pattern: '^# Straddle Go Live review\s*\n\s*Status: not ready \([^\n]+\)\s*\nPlan: straddle-integration-plan\.md\s*\nPlan hash: (?:c3891391a877cc5ed17333f58675661edc29e875fac3d2fb2728aef66dfc187e|unknown)\b'
flags: m
arm: with-only
---

The review is not ready and names the approved plan it checked against, at its hash, or `unknown` because this case grants no Bash to compute it.
