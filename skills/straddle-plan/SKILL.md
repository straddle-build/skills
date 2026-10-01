---
name: straddle-plan
description: Write or refresh a source-backed straddle-integration-plan.md before any Straddle code change or sandbox resource creation. Use when a developer wants to plan, scope, or design a Straddle integration (Pay by Bank, charges, payouts, Bridge, paykeys, direct, SaaS, or marketplace platforms), asks which SDK, headers, notification path, or tests they need, or after straddle-setup reports ready. Plan interviews the developer in rounds, with a recommended answer for each question, records every decision in the plan, and only describes future writes.
metadata:
  version: 0.1.0
---

# Straddle Plan

Write or refresh `straddle-integration-plan.md` in the application repository. The plan names the files, SDK methods, account rules, notification path, tests, and every future Sandbox write before anyone changes code.

Read [straddle-best-practices](../straddle-best-practices/SKILL.md) first. Its rules on credentials, account scope, idempotency, the fourteen excluded operations, notifications, and tools apply to the plan and are cited there rather than copied.

Write developer-facing replies in the [Straddle voice](../straddle-best-practices/references/voice.md); safety text and markers stay exact. In a [Straddle Wizard program](../straddle-best-practices/references/wizard-program.md) session, Plan finishes when step 6 records the approval. That ends Plan, not the turn: start the next listed skill as that page says.

## Boundaries

- Plan writes only `straddle-integration-plan.md`, plus, in step 6 and only after the developer approves the plan, the plan's approval record and at most one companion view, `straddle-plan-visual.html`, at the repository root. It does not edit application code, install packages, or change configuration.
- No remote writes. Plan never creates, deletes, unmasks, or reveals anything, and never runs a bootstrap. It may read the Docs MCP and the installed SDK source.
- Plan finds the facts in the repository, the installed SDK, and the references itself, and asks the developer only for decisions, each with a recommended answer. It does not pick the integration type, SDK, or notification path for the developer.
- Do not read `.env*`, credential stores, or private keys.

## Steps

1. [steps/01-decisions.md](steps/01-decisions.md): interview the developer in rounds, as [references/interview.md](references/interview.md) (adapted from mattpocock/skills, MIT; notice in [references/third-party-licenses.md](references/third-party-licenses.md)) describes, recording each decision and settled term in the plan.
2. [steps/02-sources.md](steps/02-sources.md): read the repository, the installed SDK source, and the current Straddle docs.
3. [steps/03-write-plan.md](steps/03-write-plan.md): write the plan from [references/plan-template.md](references/plan-template.md).
4. [steps/04-review.md](steps/04-review.md): check the plan file against the rules and fix it.
5. [steps/05-handoff.md](steps/05-handoff.md): summarize and show the integration shape and the files to change with [show-me.md](../straddle-best-practices/references/show-me.md), print the handoff marker, and leave the plan for the developer's review.
6. [steps/06-show-me.md](steps/06-show-me.md): only after a `draft` handoff and the developer's explicit approval of the current plan, record that approval in the plan and show it visually with [show-me.md](../straddle-best-practices/references/show-me.md).

Each step file lists what it needs, its allowed tools, the next step, and its summary and marker.

## Markers

Print each marker on its own line, exactly as shown, with one-line JSON. Open one step file at a time, in order, even when the request already answers the step's questions or the step needs no tools. Right after reading a step file, and before any other tool call (including reading a reference or the next step file), send a visible progress message whose first line is that step's `STRADDLE_PROGRESS` marker, printed once. When the step's work needs no tools, such as a review or a summary of output already in the conversation, make the one sentence after the marker that step's result before you open the next step file. Do the step's work, and only then open the next step file. Do not read ahead, read several step files in one call or command, save markers up, or print them after the work or in the final report.

```text
STRADDLE_PROGRESS {"skill":"straddle-plan","step":"01-decisions"}
STRADDLE_ABORT {"skill":"straddle-plan","step":"01-decisions","reason":"developer did not choose an integration type"}
STRADDLE_HANDOFF {"skill":"straddle-plan","status":"draft","report":"<summary>"}
```

`status` is `draft` when the plan is complete and awaits the developer's approval, or `blocked` when unresolved decisions stop implementation.

Outside a Wizard program, `STRADDLE_HANDOFF` ends the planning turn. In a Wizard program it also stops for the developer's review, because the plan isn't approved yet. Step 6 continues on a later turn, only when the handoff was `draft` and the developer then explicitly approves the plan. It prints its own `STRADDLE_PROGRESS` marker and no second handoff. Step 1's interview rounds end the turn too, with no handoff: step 1 continues when the developer answers.
