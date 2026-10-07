# Choose a Straddle skill

Use a skill for the stage your application needs: check readiness, make a plan, build the integration, or verify the result. Start from your application directory so the agent reads the code and SDK you use.

[Install the skills or plugin](../README.md#install) before starting. The [v0.1.2 plugin release](https://github.com/straddle-build/skills/releases/tag/v0.1.2) includes the nine skills in the following catalog. [Payment Review](#review-changes-from-a-wizard-session) is also available on the default branch.

## Choose a skill

Each skill has a defined task and an output you can inspect.

| Your task | Skill | Result |
| --- | --- | --- |
| Check your tools, SDK, environment, and MCP connections | [Setup](../skills/straddle-setup/SKILL.md) | `straddle-setup.md` with readiness and next actions |
| Choose products, integration model, SDK, and documentation | [Get Started](../skills/straddle-get-started/SKILL.md) | An orientation report and the next skill to run |
| Decide how Straddle fits your application | [Plan](../skills/straddle-plan/SKILL.md) | `straddle-integration-plan.md` with decisions, files, and tests |
| Implement an approved integration plan | [Integrate](../skills/straddle-integrate/SKILL.md) | Code changes and `straddle-integration-report.md` |
| Verify an integration or migration | [Test](../skills/straddle-test/SKILL.md) | `straddle-test-evidence.md` with results and gaps |
| Review production readiness | [Go Live](../skills/straddle-go-live/SKILL.md) | `straddle-go-live-report.md` with evidence and remaining work |
| Add Straddle beside an existing provider | [Migrate](../skills/straddle-migrate/SKILL.md) | A migration plan, approved code changes, and `straddle-migration-report.md` |
| Investigate a failure or review existing code | [Audit](../skills/straddle-audit/SKILL.md) | `straddle-audit-report.md` with confirmed findings and recovery steps |
| Answer a Straddle integration or payment-lifecycle question | [Best Practices](../skills/straddle-best-practices/SKILL.md) | Shared product, SDK, account-scope, and notification guidance |

Setup records missing prerequisites. Get Started and Migrate require an API key and an explicitly selected Sandbox environment before they inspect the application. Set those values in your client environment as described in [Check your application](../README.md#check-your-application).

## Run a skill

In a Claude Code session with the Straddle plugin installed, invoke a skill by its plugin command:

```text
/straddle:straddle-plan
```

In Codex, Cursor, or a client with portable skills installed, name the skill and the work you want it to do:

```text
Use the straddle-plan skill to plan a Straddle integration in this repository.
```

To run the same stage through the Straddle Wizard, use its skill command:

```bash
npx @straddlecom/wizard@latest skill run straddle-plan
```

The agent reads the repository and asks for decisions it needs. Keep the resulting plan and reports in the application repository so later stages can use them.

## Build an integration

Use Setup to check prerequisites, then Plan to decide the integration model, SDK, account scope, and notification path. Plan records the proposed files and tests for your review.

After approving the plan, ask Integrate to implement it:

```text
Use the straddle-integrate skill to implement the approved straddle-integration-plan.md.
```

Integrate changes the files the plan names. Before creating Sandbox resources, it shows the target, account, operation, payload summary, and idempotency key for approval. The final report records both code changes and the requests that ran.

## Add Straddle beside another provider

Migrate inventories the existing provider and writes `straddle-migration-plan.md`. After you approve the plan, it adds Straddle code paths while keeping the existing provider path available.

Name your provider in the request:

```text
Use the straddle-migrate skill to plan adding Straddle beside our Stripe integration.
```

Provider guides cover Stripe, Plaid, Moov, Modern Treasury, Dwolla, Paya, Payliance, and other integrations. Customer-data transfer and production cutover need their own reviewed process. After the code changes, use Test with the approved migration plan.

## Verify an integration

Test follows the verification section of an approved integration or migration plan. It records offline checks, observed Sandbox behavior, and scenarios that still need work.

Name the plan to test, especially when the application has both kinds:

```text
Use the straddle-test skill to verify the approved straddle-integration-plan.md.
```

Sandbox writes receive their own preview and approval. If a check fails, use its evidence to direct the next Integrate change, then run Test again.

Go Live reviews configuration, code, Sandbox evidence, and operational setup. Its output supports your launch decision; you make the production change separately.

## Investigate existing code

Audit checks a reported symptom against the installed SDK and API contract, then reports confirmed findings with file locations and recovery steps.

Describe the behavior you observed:

```text
Use the straddle-audit skill to investigate duplicate payment updates in our webhook handler.
```

Review `straddle-audit-report.md` before approving a specific fix. Each approved fix becomes a separate recovery step.

## Review changes from a Wizard session

[Payment Review](../skills/straddle-payment-review/SKILL.md) checks the payment paths changed during a Wizard session and produces an advisory report. It uses `.straddle-wizard/session-baseline.json` to identify the session's changes, then checks authorization, ownership, server-side amounts, webhook verification, secret exposure, and recovery behavior.

Install it from the default branch with the skills installer or a repository marketplace. Confirm that `straddle-payment-review` appears in your client's skill list. To supply the required session baseline, use the compatible workflow from [Wizard source](https://github.com/straddle-build/wizard); the skill's [scope instructions](../skills/straddle-payment-review/steps/01-scope.md) describe that prerequisite.

## Find the shared references

Every skill uses [Best Practices](../skills/straddle-best-practices/SKILL.md) for the Straddle product model and integration rules. Its references cover credentials, account scope, payment behavior, notifications, and tool selection.

For installation and updates, return to the [repository README](../README.md). For authoring and evaluation checks, see [package validation](packaging.md#validation) and [evaluation evidence](eval-evidence.md).
