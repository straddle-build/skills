---
type: regex
target: { source: file, path: straddle-integration-plan.md }
pattern: '^## Future Sandbox writes\b(?:(?!^## )[\s\S])*?(?:\bcreatePlaidPaykey\b(?:(?!^## )[\s\S])*?\bcreateBankAccountPaykey\b|\bcreateBankAccountPaykey\b(?:(?!^## )[\s\S])*?\bcreatePlaidPaykey\b)'
flags: m
arm: with-only
---

Future Sandbox writes has a paykey create row for each method, `createPlaidPaykey` and `createBankAccountPaykey`, as Plan step 3 says, so Integrate and Test can make a Sandbox paykey for each.
