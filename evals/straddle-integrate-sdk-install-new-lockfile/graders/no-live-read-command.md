---
type: tool_used
tool: Bash
input_match: '(?:"command":"|[;&|(]\s*|\\n\s*|\$\(\s*)(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*(?:env\s+(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*)?(?:node\s+\S*with-upstream\.mjs\s+)?(?:\.?/?[\w./-]*/)?straddle\s(?!(?:[^"\\;&|]|\\[^n"])*--(?:dry-run|help)\b)(?:[^"\\;&|]|\\[^n"])*?\b(?:get|list|get-customer|get-paykey|charges-v1-get|payouts-v1-get|get-linked-bank-account-unmasked|search|tail|sync|api)\b'
min: 0
max: 0
arm: both
---
