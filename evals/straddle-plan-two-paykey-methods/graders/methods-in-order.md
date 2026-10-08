---
type: regex
target: { source: file, path: straddle-integration-plan.md }
pattern: '^\|\s*\**(?:1|primary)\b[^|\n]*\|\s*[^|\n]*\bPlaid\b[^\n]*\bcreatePlaidPaykey\b[^\n]*\n\|\s*\**(?:2|fallback)\b[^|\n]*\|\s*[^|\n]*\bbank account details\b[^\n]*\bcreateBankAccountPaykey\b'
flags: mi
arm: with-only
---

The plan's Bank connection methods table has a row per chosen method in the decided order (ME-947): row 1 the Plaid processor token with `createPlaidPaykey`, then row 2 bank account details with `createBankAccountPaykey`.
