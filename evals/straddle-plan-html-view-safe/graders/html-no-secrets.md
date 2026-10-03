---
type: regex
target: { source: file, path: straddle-plan-visual.html }
pattern: 'showme_do_not_leak|showme-paykey-do-not-leak|synthetic-eval-key-not-a-secret|STRADDLE_API_KEY\s*=|STRADDLE_WEBHOOK_SECRET\s*=|TEST_PAYKEY'
match: not_contains
arm: with-only
---
