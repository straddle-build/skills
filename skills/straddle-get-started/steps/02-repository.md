# Step 2: Repository facts

- **Needs:** step 1 summary.
- **Tools:** Read, Glob, Grep. No shell commands, including shell reads such as `cat`, `ls`, `find`, `grep`, or `head`: use Read, Glob, and Grep. No writes. Never open `.env*`, private keys, credential stores, or CLI config files, even when a glob matches them.
- **Next:** [03-choices.md](03-choices.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-get-started","step":"02-repository"}
```

Collect only facts you can cite as `path` or `path:line`:

1. **Languages and frameworks** from dependency manifests and lockfiles (`package.json`, `go.mod`, `Gemfile`, `*.csproj`, `pyproject.toml`, `requirements*.txt`).
2. **Existing Straddle code.** The package name and resolved version from the lockfile for `@straddlecom/straddle`, `github.com/straddle-build/straddle-go`, the `straddle` gem, or the `Straddle` NuGet package.
3. **Existing payment provider code.** Imports or SDK dependencies for Stripe, Plaid, Moov, Modern Treasury, Dwolla, Paya, Payliance, or any hand-rolled ACH/NACHA code (treat that as "Other").
4. **Hints about the business shape**, such as seller, merchant, tenant, or sub-account models, and a README description. Record these as hints for the questions in step 3, never as the answer.
5. **Existing plan files**: `straddle-integration-plan.md`, `straddle-migration-plan.md`. Read them if present.

When nothing matches a category, say so. Do not guess a framework from folder names alone.

**Summary for step 3:** the facts table (fact, evidence), the hints, and what was not found.
