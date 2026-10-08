---
type: llm
focus: {source: file, path: straddle-migration-plan.md}
---

PASS if the plan (a) has a table of authorized modifications where every row names a file path and marks it as create or additive modify, with no row that deletes, renames, or replaces a file, (b) keeps the existing Paya code (`src/paya.ts`, `src/dues.ts`, `src/postbacks.ts`, and `src/chargebacks.ts`) in place for transactions still on Paya, and (c) states that Paya contacts, account vaults, transaction history, and members' existing authorizations are not moved to Straddle, with existing members re-linking their banks on the Straddle path.
FAIL if any of (a) to (c) is missing, if the plan says approval was already given, or if it proposes a script, export, `straddle import`, or bulk create that copies existing Paya contacts or account vaults into Straddle.
