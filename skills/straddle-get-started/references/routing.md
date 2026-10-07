# Routing

Map the developer's answers to what to use next.

## SDK by language

The released package and version for each language are in the Current versions table of [straddle-best-practices](../../straddle-best-practices/SKILL.md), the one source for SDK versions. Recommend the row that matches the language of the service that will call Straddle, and confirm the installed or latest published version against that table before naming a method.

| Language in the repository | Install command |
| --- | --- |
| TypeScript or JavaScript | `npm install @straddlecom/straddle` |
| Python | `pip install straddle` |
| Go | `go get github.com/straddle-build/straddle-go` |
| Ruby | `bundle add straddle` |
| C# / .NET | `dotnet add package Straddle` |

A repository with several languages gets the SDK for the service that will call Straddle, which the developer names. Browser code never holds the API key; it talks to the developer's server.

## Account scope by integration model

| Model | One-line rule |
| --- | --- |
| Direct account | Never send `Straddle-Account-Id`. The key identifies the account. |
| SaaS | Customers, paykeys, charges, and payouts act for an explicitly selected embedded account. |
| Marketplace | Customers, paykeys, and Bridge belong to the platform and omit the header; charges and payouts name the seller's embedded account. |

Organization and account-management operations omit the header for every model. The full table is in [straddle-best-practices account scope](../../straddle-best-practices/references/account-scope.md).

## Documentation topics to search

The published docs are at `https://straddle-build-straddle-openapi.apidocumentation.com`. Search them through the Docs MCP when it is available.

| Choice | Docs MCP query |
| --- | --- |
| Pay by Bank | "Pay by Bank", "Bridge", "paykeys", "charges" |
| Payouts | "payouts" |
| Platform onboarding | "embedded accounts", "hosted onboarding", "organizations" |
| SaaS or marketplace | "platforms", "Straddle-Account-Id" |
| Notifications | "webhooks", "FIFO endpoint", "polling endpoint" |
| Sandbox testing | "sandbox", "sandbox_outcome" |

## Next skill

| Situation | Next skill |
| --- | --- |
| No Straddle code, no provider to replace | [straddle-setup](../../straddle-setup/SKILL.md), then [straddle-plan](../../straddle-plan/SKILL.md) |
| Existing provider code (Stripe, Plaid, Moov, Modern Treasury, Dwolla, Paya, Payliance, or Other) to replace or run beside | [straddle-migrate](../../straddle-migrate/SKILL.md) |
| Straddle code already present and the developer reports a problem or wants a review | [straddle-audit](../../straddle-audit/SKILL.md) |
| A Straddle Wizard session finished Test, and the developer wants a payment review of the code it wrote | [straddle-payment-review](../../straddle-payment-review/SKILL.md) |
| Straddle integration tested in Sandbox and heading to production | [straddle-go-live](../../straddle-go-live/SKILL.md) |
| A choice is still open | No skill yet. Answer the open choice first. |
