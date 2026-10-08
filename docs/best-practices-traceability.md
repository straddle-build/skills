# Best Practices rule sources

This table traces each numbered rule in [Best Practices](../skills/straddle-best-practices/SKILL.md#rules) to the build plan or the API contract (ME-815). The build plan is the Linear document "Build plan: Straddle AI Developer Experience", reconciled on 2026-09-28. Section numbers are the plan's own, and quotes are excerpts.

This page is for reviewers. It lives in `docs/`, outside `skills/`, so plugin and skills-only installs don't ship it to agents.

| Rule | Source | Source text |
| --- | --- | --- |
| 1. Environment and credentials | Section 2, Credential handling | "Use client-supported secret/environment inputs. No credential in manifests, skills, chat, logs, receipts, or source control." |
| 1 | Section 6, Authentication and environment | "Never put credential values into plugin manifests, skills, model context, logs, plans or evidence." |
| 1 | Section 12, Discovery | The ME-816 lint "rejects ... credential file reads". |
| 1 | Section 12, Behavior | "A missing key or environment returns a configuration error before any request. Never a silent no-op." |
| 1 | Section 10, Wizard boundaries | "exclude `.env*`, credentials, private keys, local CLI configuration". Cursor's manifest "declares `STRADDLE_API_KEY`". |
| 2. Account scope | Section 6, Acting-account selection | "A direct integration derives scope from its credential and sends no platform acting-account header." |
| 2 | Section 6, Header rules to preserve | "Marketplace customer, paykey and Bridge operations omit `Straddle-Account-Id`." "Marketplace seller-attributed charges and payouts require the selected embedded account." |
| 2 | Section 6, Header rules to preserve, and section 3 | SaaS operations "follow the current account-scope policy", which section 3 gives to `straddle-cli`. |
| 2 | CLI account-scope policy over contract 1.0.4 | [`vectors.json`](../fixtures/account-scope/vectors.json), generated from `internal/straddleacct`: SaaS `createCustomer`, `createBankAccountPaykey`, `createPlaidPaykey`, `createQuilttPaykey` and `createBridgeToken` are `require`. On SaaS and marketplace, `createCharge`, `createPayout`, `refundCharge`, `resubmitCharge`, `resubmitPayout`, `uploadChargeAuthorizationProof` and `uploadPayoutAuthorizationProof` are `require`, and the other charge and payout operations are `allow`, sent when an account is selected. |
| 3. Creates are idempotent | Section 12, Behavior | "Creates are idempotent." The failure is "a create without an idempotency key or exact external-ID reuse." |
| 3 | Section 7, Integrate | "stable synthetic external IDs", "sends supported idempotency keys", and "exact external-ID lookup only for reuse or recovery after an ambiguous result." |
| 4. Fourteen operations never use `execute-request` | Section 2, Sandbox actions | "Use the existing SDK/CLI, not `execute-request`, for the fourteen creation, delete, unmask and reveal operations." |
| 4 | Section 2, MCP policy | "Scalar does not currently enforce that flag, so `execute-request` can reach them". |
| 4 | Section 6, Read and write policy | "Customer, paykey and payment creation use the released SDK or existing CLI, never `execute-request`". |
| 4 | Section 5 | The fourteen: "charge, payout and customer creation; all three paykey-creation endpoints; every currently published DELETE; all six unmask operations; and paykey reveal." |
| 5. Writes need a preview and approval | Section 2, Sandbox actions | "Show the intended operations, environment, account targets, and idempotency choices before approval." "Context or payload changes require renewed approval." |
| 5 | Section 6, Authentication and environment | "Make environment and intended account explicit before any request. Integration proofs use Sandbox. A changed target or payload requires a new user approval." |
| 5 | Section 6, Read and write policy | "Integration workflows preview intended changes and require visible approval." |
| 6. Notifications | Section 2, Onboarding | "a webhook endpoint, a FIFO endpoint, or a polling endpoint. Never recommend polling ordinary API reads. Dashboard email remains a supported human confirmation." |
| 6 | Section 7, Plan | "Dashboard email is a human confirmation, not a notification model." |
| 6 | Section 7, Integrate | "The handler guidance for skills is `references/receiving-webhooks.md`". |
| 6 | Section 12, Discovery | The retiring Mintlify skill "recommends polling `GET /v1/charges/{id}`", and the lint "rejects resource-read polling". |
| 7. Tools | Section 2, Documentation | "Use Docs MCP for documentation discovery and API MCP for permitted requests." |
| 7 | Section 7, Integrate | "Hosted Scalar API MCP for permitted reads and verification", "The Straddle CLI for deterministic diagnostics and sandbox helpers", "The developer's selected SDK for the application operation being proven." |
| 7 | Section 6, Read and write policy | Keep the fourteen unchecked and the "remaining allowed writes". |
| 7 | Section 7, Setup and Plan | "Setup is read-only." "Plan does not mutate the Straddle API." |

## Clauses without a build plan or contract source

These clauses have no source in the build plan or the contract. Each names the commit that added it.

- Rule 4: "Operations outside the public API contract are not run by any tool." Added in `bf4aa83`.
- Rule 6: the webhook endpoint as the default, with FIFO or polling only in the cases `notifications.md` names. Section 2 lists the three endpoint types without a default. Added in `dd19dd4` for ME-991.
- Rule 7: telling the developer that the Docs MCP is exposing execution when it lists API tools. Section 2 limits the Docs MCP to documentation discovery but doesn't ask for the report. Added in `446df3c`.
