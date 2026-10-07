---
name: straddle-payment-review
description: Advisory, read-only payment-path checklist review of the code a Straddle Wizard session wrote. Use when the Straddle Wizard launches the payment review after Test, or a developer asks for a payment-path review of the Straddle changes made in this Wizard session. Computes the session's changes from `.straddle-wizard/session-baseline.json`, checks money-moving routes against the app's own authorization and ownership model, server-side amounts, webhook verification, secret exposure, CSRF, error recovery, Sandbox shortcuts, and refund guards, applies the Audit safety, notification, and SDK checks to the diff, and reports severity and file:line in `straddle-payment-review.md`, which the Wizard writes from the printed report in a Wizard review. Not a security audit. Never edits code.
metadata:
  version: 0.1.0
---

# Straddle Payment Review

Check the code this Straddle Wizard session changed in the repository in the current working directory against a fixed payment-path checklist, with fresh eyes, and report only the matches those changes caused. The agent that wrote the code is not the reviewer, so take nothing from earlier conversation. Read the code.

This review is advisory. It is not a security audit, penetration test, or certification, and a clean report does not mean the code is safe. Never call it a security review or imply assurance. It never blocks Go Live.

Read [straddle-best-practices](../straddle-best-practices/SKILL.md) first. Its rules on credentials, webhooks, and idempotency are the baseline.

## Boundaries

- **Wizard review.** When the request carries the line `Straddle Wizard review: print the report; don't write files.`, the Wizard has started this session as a separate, read-only process with no network. Write no file at all: step 3 prints the report and the Wizard saves it. Without that line, the only file you write is `straddle-payment-review.md` at the repository root.
- **Read-only.** Never edit, create, move, or delete any other file, even to fix a finding. Fixes go back through [straddle-integrate](../straddle-integrate/SKILL.md) after the developer approves them.
- **No mutation, no network.** In a Wizard review, the Wizard has already written the scope and hashes, so compute nothing. Read files with your read tools. Where a shell is your only way to read files (Codex, which the Wizard starts in its read-only sandbox), run only read-only commands that print files or search them, such as `cat`, `ls`, `rg`, `grep`, and `sed -n`, and never a Git command, package manager, build, test, or app code. Outside one, Bash runs only this skill's `scripts/session-state compare <snapshot>`, `git cat-file blob <snapshot>:<path> | diff - <path>`, and the plan hash command. They read raw bytes and run no command the repository's Git configuration names. Never run `git diff`, `git show`, `git status`, or `git hash-object`, which can run configured filter, textconv, or fsmonitor commands. No install, build, test run, app code, or anything that writes. No Straddle request, CLI call, MCP call, or web fetch.
- **Session scope.** Report a risk only when the session's changes caused it. Read unchanged auth, session, configuration, and caller code to judge the changed code, but a risk that lives entirely in unchanged code is not a finding, however bad it looks.
- **No secret values.** Never open `.env*`, private keys, or credential stores. Name a leaked key, signing secret, or paykey token by its file:line and kind, never by its value.

## Steps

1. [steps/01-scope.md](steps/01-scope.md): read the baseline and list the session's changes.
2. [steps/02-review.md](steps/02-review.md): apply the checks to those changes.
3. [steps/03-report.md](steps/03-report.md): print the report in a Wizard review, or write `straddle-payment-review.md`.

## Markers

Print each marker on its own line, exactly as shown, with one-line JSON. Open one step file at a time, in order. Read the step file, then print its `STRADDLE_PROGRESS` marker immediately, before any other tool call. Do the step's work, and only then open the next step file.

```text
STRADDLE_PROGRESS {"skill":"straddle-payment-review","step":"02-review"}
STRADDLE_HANDOFF {"skill":"straddle-payment-review","status":"findings","report":"straddle-payment-review.md: <one-paragraph summary>"}
```

`status` is the report's `Status` value: `clean`, `findings`, or `incomplete`.
