---
name: straddle-test
description: Verify a finished Straddle integration and write sanitized evidence to straddle-test-evidence.md. Use when a developer wants to test, verify, prove, or QA their Straddle integration or Sandbox setup, run the Straddle test matrix, check account A/B isolation or Straddle-Account-Id header behavior, prove paid, failed, returned (R01), or retried payments, confirm onboarding, or confirm webhook, FIFO, or polling endpoint delivery, or after straddle-integrate reports complete. Test does not change the integration, and any Sandbox write it needs goes through an exact preview and explicit approval.
metadata:
  version: 0.1.0
---

# Straddle Test

Run the verification the approved plan names, against the Straddle code that plan authorized, and record what passed, what failed, and what did not run in `straddle-test-evidence.md`. The plan is `straddle-integration-plan.md` from [straddle-plan](../straddle-plan/SKILL.md) and [straddle-integrate](../straddle-integrate/SKILL.md), or `straddle-migration-plan.md` from [straddle-migrate](../straddle-migrate/SKILL.md). Test needs only one of them.

Read [straddle-best-practices](../straddle-best-practices/SKILL.md) first. Its rules apply to every step. Test uses the same preview, approval, and execution routes as [straddle-integrate](../straddle-integrate/SKILL.md), and cites them instead of restating them.

Write developer-facing replies in the [Straddle voice](../straddle-best-practices/references/voice.md); safety text and markers stay exact. In a [Straddle Wizard program](../straddle-best-practices/references/wizard-program.md) session, a finished handoff ends Test, not the turn: start the next listed skill as that page says.

## Boundaries

- **No architecture changes.** Test does not edit application code, configuration, or dependencies. The only file it writes is `straddle-test-evidence.md`. A gap or failing check is a finding for Integrate, not something Test fixes.
- **Missing configuration stops every Straddle request.** Test establishes the environment and credentials with Integrate's offline checks, never `straddle doctor`. Without an accepted target (explicit Straddle Sandbox, or the offline synthetic localhost target under every condition below) and a credential for a route, Test runs only offline checks and discovery on that route, and records a configuration error for everything else.
- **Sandbox writes need an exact preview and explicit approval**, following Integrate's [preview step](../straddle-integrate/steps/04-preview.md). A denial or a changed context means zero writes. The fourteen excluded operations run only through the SDK or CLI.
- **Plan approval is not write approval.** An approved integration or migration plan authorizes the file changes it lists and names the verification to run. It authorizes no Straddle request. Every Sandbox write still needs its own exact preview and explicit yes in this run. A plan that is not approved under the rules in [step 1](steps/01-begin.md) blocks Test as if there were no plan.
- **Status arrives through the selected notification path.** Test observes transitions through the webhook, FIFO, or polling endpoint, waiting at most ten minutes. It never loops on charge, payout, account, or list reads. When asked to, it declines and names the endpoint it watches instead and the ten-minute wait. Dashboard email is a human confirmation only.
- **Evidence is sanitized.** No keys, signing secrets, tokens, unmasked data, or full request bodies with personal data, in the evidence file or in replies. Never offer to show unmasked data.
- **Evidence claims only what ran.** Discovery is reported separately from authenticated execution. Evidence never says Scalar enforces the fourteen exclusions.
- **Offline synthetic target.** Test accepts the explicitly declared localhost target under the same conditions as Integrate ([offline-synthetic-target.md](../straddle-integrate/references/offline-synthetic-target.md)). Its evidence is labelled offline synthetic proof and never counts as live Straddle Sandbox proof.

## Steps

1. [steps/01-begin.md](steps/01-begin.md): confirm the plan, integration, and configuration, and select the scenarios.
2. [steps/02-offline.md](steps/02-offline.md): run the repository's tests and check the offline matrix.
3. [steps/03-preview.md](steps/03-preview.md): preview the Sandbox writes the scenarios need, and get approval.
4. [steps/04-sandbox.md](steps/04-sandbox.md): run the approved scenarios and observe notifications.
5. [steps/05-verify.md](steps/05-verify.md): run independent reads, keeping discovery and authenticated results separate.
6. [steps/06-evidence.md](steps/06-evidence.md): write the evidence file and the final marker.

Each step file lists what it needs, its allowed tools, the next step, and its summary and marker.

## Markers

Print each marker on its own line, exactly as shown, with one-line JSON. Open one step file at a time, in order, even when the request already answers the step's questions or the step needs no tools. Read the step file, then print its `STRADDLE_PROGRESS` marker immediately, before any other tool call, including reading a reference or the next step file. Do the step's work, and only then open the next step file. Do not read ahead, read several step files in one call or command, save markers up, or print them after the work or in the final report.

```text
STRADDLE_PROGRESS {"skill":"straddle-test","step":"01-begin"}
STRADDLE_ABORT {"skill":"straddle-test","step":"03-preview","reason":"configuration error: STRADDLE_API_KEY is not set"}
STRADDLE_HANDOFF {"skill":"straddle-test","status":"partial","report":"<summary>"}
```

`status` is one of:

- `passed`: every selected scenario ran and passed.
- `failed`: at least one scenario ran and failed.
- `partial`: nothing failed, but some scenarios did not run, for example Sandbox scenarios waiting for approval or configuration.
- `blocked`: no approved integration or migration plan, or no Straddle integration code, exists to test.

Emit `STRADDLE_ABORT` when the run stops early, and still print the handoff and evidence file.
