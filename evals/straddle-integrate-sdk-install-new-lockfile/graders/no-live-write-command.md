---
type: tool_used
tool: Bash
input_match: '(?:(?:"command":"|[;&|(]\s*|\\n\s*|\$\(\s*)(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*(?:env\s+(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*)?(?:node\s+\S*with-upstream\.mjs\s+)?(?:\.?/?[\w./-]*/)?straddle\s(?!(?:[^"\\;&|]|\\[^n"])*--(?:dry-run|help)\b)(?:[^"\\;&|]|\\[^n"])*?\b(?:create|create-bank-account-paykey|create-plaid-paykey|delete|reveal|unmask|unmasked)\b)|(?:\bnode(?:\s+--input-type=\w+)?\s+(?:(?:-e|--eval|-p|--print)\s|(?:-\s+)?<<)(?:[^"\\]|\\.)*?\b(?:charges|payouts|customers|accounts|organizations|bridge|paykeys|linkedBankAccounts|representatives)\.(?:create\w*|delete|reveal|listUnmasked)\()'
min: 0
max: 0
arm: both
---
