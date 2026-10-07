# Step 7: Handoff

- **Needs:** every earlier summary that exists for this run, including step 1's plan hash.
- **Tools:** Read and Write for `straddle-integration-report.md` at the repository root only. Never edit the plan here: any change to it voids its approval hash.
- **Next:** [straddle-test](../../straddle-test/SKILL.md) when the status is `complete`. In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, a `complete` status ends Integrate, not the turn: give this step's reply and print its handoff line first, then start the next listed skill in this same reply, as that page says. The Wizard ticks a step only on its handoff. This step's Tools line doesn't limit that. Any other status stops and waits for the developer.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-integrate","step":"07-handoff"}
```

Write the report to `straddle-integration-report.md` at the repository root, then give the same report in your reply. Open the reply with two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md): what's done, what isn't, and what's next. When the client doesn't allow the write, give the report in the reply and say `straddle-integration-report.md` wasn't written.

When the file already exists with the same `Plan hash`, read it first and keep its earlier Sandbox write rows, adding this run's. With a different or missing hash, replace it: it belongs to an older plan.

State what the run verified and what it did not. A passing unit test proves code behavior, not that Sandbox accepted a request. A run that stopped early, for example at step 1 without an approved plan, still writes the report: each section for work that didn't run says `not run` and why.

The header block comes first, because the Straddle Wizard reads it. `Status` follows the handoff status: `complete` for `complete`, `partial (<reason>)` for `awaiting_approval`, and `blocked (<reason>)` for `blocked`. `Plan hash` is step 1's plan hash.

```markdown
# Straddle integration report

Status: complete | partial (<reason>) | blocked (<reason>)
Plan: straddle-integration-plan.md
Plan hash: <64 hex characters> | none (plan not approved)
Target: Straddle Sandbox | offline synthetic localhost <base URL>: offline synthetic proof, not live Straddle Sandbox proof
Sandbox write approval: one-time (chat | native prompt, <client>) | standing (<client and where it saved the rule>) | none

## Changed files
| File | Change, in one line | Plan row |

(Include the manifest and lockfile the SDK install changed, with `SDK install` as the plan row.)

## Operations wired
| Operation | Route (SDK method or CLI command) | Acting account (Straddle-Account-Id) | File |

## Notifications
<endpoint type, the handler file, and what it does: verification, duplicate-safe storage, and the acknowledgement or commit for that type. Say whether the developer enabled the endpoint in the dashboard.>

## Sandbox writes run
| # | Operation | Tool | Acting account | External ID | Idempotency key | Result | ID | Created or reused | Approved at |

(Write "None" when the run made no Sandbox write. For an offline synthetic target, title this section "Synthetic upstream records" instead, because nothing was created at Straddle.)

## Tests
<the repository's test command, how many tests ran and passed, and the tests added>

## Not done or deferred
| Plan row | Reason |

(Preview rows not approved or not run, indeterminate rows, configuration errors, failed checks.)

## Next
```

In `## Next` and in the handoff line's report, state routes by the same rules as the run: each of the fourteen operations in [writes-and-approval.md](../../straddle-best-practices/references/writes-and-approval.md), every `DELETE` included, runs only through the SDK or CLI after a preview, and while configuration is unconfirmed, neither offers a Straddle API request, not even a permitted read through `execute-request`.

Sanitize the file the way Test sanitizes evidence: IDs, external IDs, idempotency keys, statuses, and HTTP status codes are fine. Never write a key, signing secret, token, paykey value, unmasked data, or personal data.

End the reply with:

```markdown
## Verify before merging

- [ ] Only the approved files changed, and existing provider code is intact.
- [ ] No secret or unmasked data appears in the diff, tests, or this report.
- [ ] Every Sandbox write above was in an approved preview row.
- [ ] Creates send idempotency keys and external IDs.
- [ ] Notifications use the selected webhook, FIFO, or polling endpoint, with no status polling of resource reads.
```

Then print on one line, followed by one or two short sentences: what finished, then what comes next, for example "The code's in and the Sandbox charge ran. Testing it end to end is next.":

```text
STRADDLE_HANDOFF {"skill":"straddle-integrate","status":"<complete|awaiting_approval|blocked>","report":"<one-paragraph summary: files changed, resources created or reused, and blockers>"}
```
