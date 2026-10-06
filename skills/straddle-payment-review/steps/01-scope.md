# Step 1: Scope

- **Needs:** the repository in the current working directory.
- **Tools:** Read, Glob, Grep. In a Wizard review, nothing else, except the read-only shell commands the Boundaries allow when a shell is your only way to read files. Outside a Wizard review, Bash only for this skill's `scripts/session-state compare <snapshot>` and `git cat-file blob <snapshot>:<path> | diff - <path>`.
- **Next:** [02-review.md](02-review.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-payment-review","step":"01-scope"}
```

## Wizard review scope

In a Wizard review the request also carries a line `Straddle Wizard review scope: <dir>`, a directory the Wizard wrote before starting you. Use it instead of the baseline and script below, and compute nothing:

- `<dir>/changes.txt` is the compare output: the first line `code-hash <64 hex>`, then `added <path>`, `modified <path>`, or `deleted <path>` lines.
- `<dir>/plan-hash.txt` holds the report's `Plan hash` value.
- `<dir>/start/<path>` holds the start version of each modified or deleted file. Read it and the current file with Read, and compare the two yourself.

When the line or a file in it is missing, go to step 3 with `Status: incomplete (no review scope)`. Otherwise skip to the Added, Modified, and Deleted rules under Session changes.

## Baseline

The Straddle Wizard writes `.straddle-wizard/session-baseline.json` when the session starts:

```json
{ "head": "<commit sha or null>", "snapshot": "<commit sha>", "startedAt": "<ISO 8601>" }
```

`snapshot` is a commit holding every file as its bytes were on disk at session start, tracked or untracked, except the files `.gitignore` excludes and the excluded paths below. The [Wizard program](../../straddle-best-practices/references/wizard-program.md#payment-review) page says how it is built.

When the file is missing or isn't valid JSON, the session's changes can't be told apart from older code. Don't review the whole repository as session code. Go to step 3 with `Status: incomplete (no session baseline)`.

## Session changes

Run `scripts/session-state compare <snapshot>` from this skill's directory, with the repository as the working directory. Its first line is `code-hash <64 hex>`; keep the hash for the report. Each later line is `added <path>`, `modified <path>`, or `deleted <path>`, comparing the bytes on disk now with the snapshot. When it exits non-zero, go to step 3 with `Status: incomplete (<its error>)`.

- **Added:** the whole file is session code.
- **Modified:** compare the start version with the file now to find the session's lines. An edit made before the session is already in the snapshot, so it doesn't count. In a Wizard review, the start version is `<dir>/start/<path>`. Outside one, `git cat-file blob <snapshot>:<path> | diff - <path>` shows the lines directly.
- **Deleted:** the session removed the file. Judge whether its removal drops a guard that other code relied on.

The script and the snapshot leave out `.straddle-wizard/`, `straddle-payment-review.md`, `straddle-go-live-report.md`, and secret-shaped files at any depth, the same ones the Boundaries forbid opening. Nothing else is skipped.

Don't run `git diff`, `git show`, `git status`, or `git hash-object` here. They can run filter, textconv, or fsmonitor commands the repository's configuration names. The script and `git cat-file blob` read raw bytes and run none of them.

Keep each session file's session lines for the next step. When there are none, the review is `clean` with nothing reviewed. Say so in the report.
