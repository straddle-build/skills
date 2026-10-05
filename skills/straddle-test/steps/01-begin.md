# Step 1: Begin

- **Needs:** the developer's request, the approved plan (`straddle-integration-plan.md`, or `straddle-migration-plan.md` for a migration), and the Integrate report (`straddle-integration-report.md`) or Migrate report (`straddle-migration-report.md`) when one exists.
- **Tools:** Read, Glob, Grep; Bash only for the offline configuration checks and the plan approval hash in Integrate's [step 1](../../straddle-integrate/steps/01-begin.md), `straddle --version`, `straddle auth status --agent`, and reading the run ID and the dispute scenario's bank account number from `/dev/urandom`. Edit only for the chosen plan's two approval lines, as the [Which plan](#which-plan) section says. No other writes, and no command that can reach Straddle, including `straddle doctor`.
- **Next:** [02-offline.md](02-offline.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-test","step":"01-begin"}
```

Read [straddle-best-practices](../../straddle-best-practices/SKILL.md) and the plan. When there is no approved plan, or the repository has no Straddle integration code, print `STRADDLE_ABORT`, skip steps 2 to 5, and go to [step 6](06-evidence.md). It writes the evidence file with its header block (`Status: blocked (<reason>)`, `Plan:`, `Plan hash:`, `Latest run:`, and `Test charge: none`), with plan hash `none (plan not approved)` when no plan is approved, and hands off to Plan, Integrate, or Migrate. Asking the developer to approve the plan doesn't pause Test: an unapproved plan still blocks it, so the reply that asks also writes the blocked evidence and the handoff.

## Which plan

- `straddle-integration-plan.md` is approved under Integrate's [step 1](../../straddle-integrate/steps/01-begin.md#recorded-approval) rules: its recorded approval matches the current file, or the developer approves the current plan in this conversation. A recorded approval from an earlier session counts, and a plan changed after its recorded approval is not approved until the developer approves it again. `straddle-migration-plan.md` is approved the same way: Migrate's [step 5](../../straddle-migrate/steps/05-approval.md) records `- Plan state: Approved` and an `- Approval` line whose sha256 must match the same command run on `straddle-migration-plan.md`, or the developer approves the current file in this conversation. A migration plan edited after its approval is not approved until the developer says so again. A draft plan, or one with no approval by either route, blocks Test as if there were no plan.
- When the chosen plan has no valid recorded approval and the developer approves the current file in this conversation, in their own words, record it before step 2 the way Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval) does: set `- Plan state: Approved`, run the hash command on the chosen plan, and write `- Approval: <YYYY-MM-DD>, "<the developer's words>", recorded by straddle-test, sha256 <hash>`. Change nothing else in the plan. Never accept or record an approval of either plan whose state is `Blocked`, or that has an `Unresolved` item affecting a file it lists or a write it plans. This holds even when a recorded approval's hash matches, because an approval never clears a blocker. The plan stays unapproved and blocks Test as above, and the handoff names the items and sends the developer to Plan or Migrate. The Straddle Wizard counts Test's run only for the plan's recorded hash, so an approval that isn't recorded leaves Test unfinished.
- In a session the Straddle Wizard reopened, an approval of either plan in this conversation counts, and is recorded, only when the developer gives it after the reopen message. Before that message, only the recorded approval counts, as [Reopened sessions](../../straddle-best-practices/references/wizard-program.md#reopened-sessions) says.
- When only one plan file exists, that is the plan.
- When both exist, use the one the developer or the handoff named: a request that mentions the migration, the Migrate report, or `straddle-migration-plan.md` selects the migration plan, and one that mentions Integrate or `straddle-integration-plan.md` selects the integration plan. When neither is named and only one is approved and lists the Straddle code under test, use that one. Otherwise ask the developer which plan to test against, and do not choose.
- A migration plan supplies the integration model, SDK, notification path, the flows and status mapping, the authorized files, and its Verification section (test command, new tests, status-mapping coverage, and the `sandbox_outcome` values for Sandbox proof). It has no Sandbox writes table and names no acting accounts. Take the scenario rows below from its Verification section; when a selected scenario needs a decision the plan does not make, such as the acting accounts A and B for a SaaS or marketplace migration or an outcome the plan does not list, ask the developer and record the answer as developer-stated. Do not infer it, and do not run that scenario without it.
- Either plan's approval covers its file changes only. Every Sandbox write this run makes still gets its own preview and explicit yes in step 3.
- Keep the hash the command prints for the chosen plan as this run's plan hash, for step 6. When the plan isn't approved, the plan hash is `none (plan not approved)`.

Run the offline configuration checks from Integrate's step 1 and record **configured** or **configuration error** for each route, with exactly what is missing. Never print or read a credential value. The non-secret `STRADDLE_ENVIRONMENT` and `STRADDLE_BASE_URL` values may be shown, as Integrate's step 1 does, and the target is recorded as `Straddle Sandbox` or `offline synthetic localhost <base URL>`.

## Run ID

Make this run's ID first, before the plan check above, so a blocked run has one too, with `LC_ALL=C tr -dc a-z0-9 < /dev/urandom | head -c 10`. Never make one up or derive it from the time, because two runs can start in the same second. Step 3 namespaces this run's external IDs with it, and step 6 writes it as `Latest run` and the run's section heading. Keep it for the whole run, including a later yes that continues this run's unchanged preview, so retries reuse the same external IDs and idempotency keys. A new Test run makes a new ID.

## Select scenarios

Take the scenarios from the plan's verification section, and confirm them with the developer when the plan is unclear. Only the plan's integration type (a migration plan's integration model) and notification path apply.

| Scenario | Proves | Needs Sandbox writes |
| --- | --- | --- |
| Configuration | a missing key or environment fails before any request, with zero requests | no |
| Account scope | the header is present or omitted per operation for the integration type, and a missing required account fails locally with zero requests | no |
| A/B switching (SaaS, marketplace) | requests for accounts A and B each carry the right account, and header-omitted calls stay omitted | offline first, then Sandbox |
| Success | a charge with `config.sandbox_outcome: paid` reaches `paid`. Sandbox payouts don't reach `paid` today (see [payouts.md](../../straddle-best-practices/references/payouts.md#events-and-sandbox-outcomes)), so payout `paid`, `failed`, and `reversed` handling is covered offline with recorded event payloads, not as a Sandbox scenario. | yes |
| Failure and return | a charge with `reversed_insufficient_funds` reaches `paid`, then `reversed` with return code `R01`, after a timed funding sweep ([step 4](04-sandbox.md#funding-sweep-for-the-return)) | yes |
| Retry | repeating a create with the same idempotency key, or exact external-ID reuse, returns the same resource instead of a duplicate | yes |
| Onboarding (platforms) | the API-created account A or B is resolved by exact external ID or the notification path and used in an account-scoped payment. The form-created proof waits for Onboarding V2. | yes |
| Notification | every transition arrives through the selected webhook, FIFO, or polling endpoint, verified, persisted once, with a prompt `2xx` where deliveries arrive | yes |

For each lifecycle the plan covers, add the matching rows from the scenario matrix in [sandbox-outcomes.md](../../straddle-best-practices/references/sandbox-outcomes.md#what-your-app-must-handle): customer review, paykey review, failure before funding, dispute and R29 block, Straddle hold, blocked payment, refund, cancel window, and funding. Each row names the `config.sandbox_outcome` to create the resource with and the transitions that must arrive through the notification path.

The dispute and R29 block scenario creates its paykey from its own bank account number, one no other scenario, earlier run, or the developer's demo uses. Choose it here: a number the developer gives for it, or 10 digits read from `/dev/urandom` with `LC_ALL=C tr -dc 1-9 < /dev/urandom | head -c 10`. Don't make one up, because a made-up number tends to repeat across runs. An R29 blocks every paykey made from that bank account, across customers, and Straddle refuses new links of it ([returns-and-disputes.md](../../straddle-best-practices/references/returns-and-disputes.md#states-and-transitions)), so a shared number would break the other scenarios and the demo. This holds even when the developer asks to share one.

A webhook receiver is not required: a polling endpoint is a complete notification path.

**Summary for step 2:** the run ID, the chosen plan and its plan hash, plan decisions, configuration result, acting accounts A and B, the selected scenarios, and the dispute scenario's own bank account number when that scenario is selected.
