---
type: llm
focus: trace
arm: with-only
---

PASS if the assistant asks how a guest shopper maps to a Straddle customer, and its recommended answer keeps one Straddle customer per person: it says a customer's email must be unique on the Straddle account, so a returning shopper's second customer create would fail, and it reuses an existing customer only after the shopper proves they own the email, for example by logging in or entering a code emailed to them.
FAIL if it recommends or offers creating a new Straddle customer for each checkout or order, recommends reusing an existing customer because the typed email matches without proof the shopper owns it (reuse gated to Sandbox only, as a test convenience, is fine), or never raises how guests map to customers.
