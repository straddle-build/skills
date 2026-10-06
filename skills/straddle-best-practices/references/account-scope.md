# Account scope

`Straddle-Account-Id` names the embedded account a platform acts for. Whether to send it depends on the integration type and the operation. This table follows the Straddle CLI account-scope policy (`internal/straddleacct` in `straddle-build/straddle-cli`) for API contract 1.0.4.

Keep three facts apart: the integration type the developer chose (their answer, the plan, or the CLI's `integration_type` in `platform.toml`, which `straddle agent-context` reports), the platform that owns the API key, and the header behavior observed in requests. A local setting records the choice; it doesn't prove what kind of platform owns the key, and API contract 1.0.4 has no field that reports it. When they seem to disagree, ask the developer instead of inferring a type or inventing a lookup.

| Operation group | Direct (`account`) | SaaS | Marketplace |
| --- | --- | --- | --- |
| Create customer, create paykey through Bridge (`bank_account`, `plaid`, `quiltt`), Bridge initialize | Omit | Required | Omit |
| Other customer and paykey reads and updates, paykey reveal and unmask | Omit | Send when an account is selected, otherwise omit | Omit |
| Create charge or payout, charge refund, resubmit, authorization upload | Omit | Required | Required |
| Other charge, payout, funding-event, and payment reads and updates | Omit | Send when an account is selected, otherwise omit | Send when an account is selected, otherwise omit |
| Organizations, accounts, account settings, representatives, linked bank accounts, onboarding | Omit | Omit | Omit |

## Failing case for each integration type

- **Direct.** Sending the header at all is wrong. The key already identifies the account. The CLI rejects an explicit `--account` for direct integrations.
- **SaaS.** Creating a customer, paykey, charge, or payout without a selected account must fail locally before any request.
- **Marketplace.** Sending the header on customer, paykey, or Bridge calls is wrong because those resources belong to the platform. Creating a charge or payout without the seller's account must fail locally before any request.
- **All platforms.** Sending the header on organization or account-management operations is wrong.

## Selecting the acting account

- Resolve an account by its Straddle ID or an exact, unique external ID. Reject a missing or ambiguous match instead of guessing.
- Show the selected account in the preview, in logs, and in test evidence.
- Use the SDK's own account-context option when it has one. Do not hand-build headers the SDK already manages.
- Platform tests switch between at least two accounts (A and B) and prove that each request carries the right account, that header-omitted operations stay omitted, and that nothing from A leaks into B.
- The hosted API MCP does not inherit the CLI's account context. Pass the account explicitly on every MCP read that needs it.
