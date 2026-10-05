---
name: straddle-integrate
description: Implement an approved straddle-integration-plan.md in the developer's repository with the installed Straddle SDK, then preview and run the approved Sandbox setup. Use when a developer wants to build, wire up, or finish a Straddle integration (Pay by Bank charges or payouts, customers, Bridge paykeys, marketplace or SaaS sellers, hosted onboarding, webhook, FIFO, or polling endpoint handling), asks to create Sandbox accounts, customers, paykeys, or charges for their app, or says the Straddle plan is approved, or asks to run, change, or retry a previewed or approved Sandbox write (for example for another account or after a timeout), or to reveal, unmask, or delete Straddle Sandbox data. Changes only the files the plan approves and never writes to Straddle without an exact preview and explicit approval.
metadata:
  version: 0.1.0
---

# Straddle Integrate

Implement the approved `straddle-integration-plan.md`: change the approved files with the installed Straddle SDK, then set up the Sandbox resources the plan needs after the developer approves an exact preview.

Read [straddle-best-practices](../straddle-best-practices/SKILL.md) first. Its rules on credentials, environments, account scope, idempotency, the fourteen excluded operations, notifications, and tools apply to every step and are cited rather than repeated. [references/execution-routes.md](references/execution-routes.md) maps each write to its SDK method and CLI command.

Write developer-facing replies in the [Straddle voice](../straddle-best-practices/references/voice.md); safety text and markers stay exact. In a [Straddle Wizard program](../straddle-best-practices/references/wizard-program.md) session, a finished handoff ends Integrate, not the turn: start the next listed skill as that page says.

## Boundaries

- **Approved files only.** Change only the files the plan's file-change table lists, plus the plan's own approval lines when step 1 records the developer's approval, and write the run's report, `straddle-integration-report.md`, in step 7. Installing the plan's SDK also changes the manifest and lockfile its package manager writes, such as `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `poetry.lock`, `go.sum`, or `Gemfile.lock`. Those changes belong to the install, not to unlisted edits: keep them, never delete or revert them, and list them under changed files. Never edit the plan otherwise. Never delete, rename, reformat, or overwrite unrelated code, including existing payment providers. A file the plan does not list needs the developer's approval and a plan update first.
- **No remote write without an exact, current approval.** Every Sandbox write appears in a preview that names its environment, base URL, acting account, operation, executing tool, payload summary, external ID, and idempotency key. Only an explicit yes to that preview counts. A denial or a changed environment, account, operation, or payload means zero writes until a new preview is approved.
- **Missing configuration stops the run.** Integrate first establishes, with offline checks only, an explicitly selected Sandbox environment and a credential for each route it will use. Without them it makes no Straddle request of any kind and reports a configuration error. When a check cannot run in this session, for example without a shell, the value is unknown, and unknown is a configuration error, not a pending detail. Code changes to approved files are not requests and may still be made.
- **The fourteen excluded operations run only through the SDK or CLI**, never the API MCP's `execute-request`. Other permitted API MCP operations stay available, mainly reads for independent verification.
- **Unmasked data never reaches the conversation.** Unmask and reveal results, and the paykey token a paykey create returns, are used only inside the SDK process or CLI command that needs them. Never print them, or offer to show them in full or summarized, in replies, logs, plans, or evidence. Record only that the read succeeded and which ID it read.
- **Sandbox only.** Integrate never writes to Production. The one other accepted target is an explicitly declared offline synthetic localhost upstream ([offline-synthetic-target.md](references/offline-synthetic-target.md)). It is offline proof only and never counts as live Sandbox proof.
- **No invented callbacks.** Hosted onboarding is completed by a person. Integrate resolves the account through the selected notification path or an authenticated exact external-ID lookup.

## Steps

1. [steps/01-begin.md](steps/01-begin.md): confirm the approved plan and check configuration without sending a request.
2. [steps/02-sources.md](steps/02-sources.md): read the installed SDK, the repository files the plan approves, and current docs.
3. [steps/03-code.md](steps/03-code.md): change the approved files.
4. [steps/04-preview.md](steps/04-preview.md): show the exact Sandbox write preview and ask for approval.
5. [steps/05-execute.md](steps/05-execute.md): run only the approved writes, chaining returned IDs.
6. [steps/06-review.md](steps/06-review.md): review the files and writes the earlier summaries touched.
7. [steps/07-handoff.md](steps/07-handoff.md): write `straddle-integration-report.md`, report code changes and server-side resources, and print the final marker.

Each step file lists what it needs, its allowed tools, the next step, and its summary and marker. References: [execution-routes.md](references/execution-routes.md), [onboarding.md](references/onboarding.md), and [offline-synthetic-target.md](references/offline-synthetic-target.md).

## Markers

Print each marker on its own line, exactly as shown, with one-line JSON. Open one step file at a time, in order, even when the request already answers the step's questions or the step needs no tools. Read the step file, then print its `STRADDLE_PROGRESS` marker immediately, before any other tool call, including reading a reference or the next step file. Do the step's work, and only then open the next step file. Do not read ahead, read several step files in one call or command, save markers up, or print them after the work or in the final report.

```text
STRADDLE_PROGRESS {"skill":"straddle-integrate","step":"01-begin"}
STRADDLE_ABORT {"skill":"straddle-integrate","step":"05-execute","reason":"configuration error: STRADDLE_API_KEY is not set"}
STRADDLE_HANDOFF {"skill":"straddle-integrate","status":"awaiting_approval","report":"<summary>"}
```

`status` is one of:

- `complete`: approved code changes and every approved Sandbox write finished.
- `awaiting_approval`: code changes are done and the preview is waiting for the developer's yes.
- `blocked`: configuration, a missing plan decision, or a denied or stale approval stopped the run. The report says which.

Emit `STRADDLE_ABORT` when the run stops before its handoff step, such as a missing or unapproved plan, a configuration error before a write, or the developer ending the run. Then go to [step 7](steps/07-handoff.md), which writes the report and prints the handoff with `blocked`.

A run that stops before a configured step 4 preview ends with a short `blocked` report instead of a preview. It names the blocker, calling a value `unknown` rather than missing when the check that would show it did not run. It says that zero Straddle API requests were sent, lists each requested operation that did not run, says the excluded operations among them will run only through the SDK or CLI, and shows no secret or unmasked value. It offers no Straddle API request, not even a permitted read through `execute-request`, until configuration is confirmed. Docs search and API spec discovery send no Straddle request and stay available as their steps allow. Per-operation routes, acting accounts, and approval belong to the step 4 preview, and any account header the report does mention must follow the header rules.
