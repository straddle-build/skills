---
type: regex
target: last_message
pattern: '^STRADDLE_REPORT_BEGIN \{"skill":"straddle-payment-review","file":"straddle-payment-review\.md"\}\n# Straddle payment review\n[\s\S]*?^STRADDLE_REPORT_END \{"skill":"straddle-payment-review"\}$'
flags: m
---
