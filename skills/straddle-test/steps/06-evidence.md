# Step 6: Evidence and handoff

- **Needs:** every earlier summary that exists for this run.
- **Tools:** Read and Write for `straddle-test-evidence.md` only.
- **Next:** the developer reviews the evidence. In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, a header `Status` of `complete` ends Test, not the turn: give this step's reply and print its handoff line first, then start the next listed skill in this same reply, as that page says. The Wizard ticks a step only on its handoff. This step's Tools line doesn't limit that. Any other status stops and waits for the developer.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-test","step":"06-evidence"}
```

Write `straddle-test-evidence.md` at the repository root with a header block and one section per run. When the file exists, read it first and keep every other run's section exactly as it is: a later run, including one that sent no Straddle request, never removes or rewrites an earlier run's evidence. Replace only a section with this run's ID, and put this run's section first, under the header block. An existing file without run sections is one earlier run; keep its content as that run's section. The title and header block appear once.

The header block describes this run, so rewrite it on every run. The Straddle Wizard reads it. `Status` is `complete` when this run's status is `passed`, `partial (<n> failed)` when it is `failed`, `partial (<what didn't run>)` when it is `partial`, and `blocked (<reason>)` when it is `blocked`. `Plan hash` is step 1's plan hash. `Test charge` is this run's live-observed Sandbox charge for the success scenario, or the first live-observed charge this run created when there's no success scenario, and `none` when this run created no Sandbox charge, including on an offline synthetic target.

The file has this shape, with this run's section first:

```markdown
# Straddle test evidence

Status: complete | partial (<reason>) | blocked (<reason>)
Plan: straddle-integration-plan.md | straddle-migration-plan.md
Plan hash: <64 hex characters> | none (plan not approved)
Latest run: <run ID>
Test charge: <charge ID> | none

## Run <run ID>, <date>

- Status: passed | failed | partial | blocked
- Plan: straddle-integration-plan.md | straddle-migration-plan.md, <approval state>
- Integration type: <direct | saas | marketplace>
- Environment: sandbox, <base URL> | configuration error: <what is missing>
- Target: Straddle Sandbox | offline synthetic localhost <base URL>: offline synthetic proof, not live Straddle Sandbox proof
- SDK: <package> <version>. CLI: <version or not used>
- Notification path: <webhook | FIFO | polling endpoint>, <what it receives with, from Endpoint types: verified deliveries, FIFO batches, or the polling consumer ID and committed offsets>, wait limit ten minutes
- Sandbox write approval: one-time (chat | native prompt, <client>) | standing (<client and where it saved the rule>) | none
- Straddle API requests sent: <how many Sandbox writes and authenticated reads this run sent to the target above; 0 when it sent none>

### Offline checks
| Check | Result | Evidence level | Source |

### Sandbox scenarios
| Scenario | Result (passed, failed, not run, not observed) | Evidence level | Evidence |

### Discovery and authenticated execution
| Check | Result |
| API MCP discovery (summarize-openapi-specs) | passed / failed / not run |
| Authenticated read (<operation>) | <status> / not run: <reason> |

### Excluded operation routing
| Operation | Executing tool |

### Server-side resources
| Resource | ID | External ID | Acting account | Status | Executing tool | Replayed | Created, reused, or observed |

### Findings for Integrate
```

Sanitize before writing:

- Resource IDs, external IDs, statuses, return codes, event IDs, and HTTP status codes are fine.
- Never write keys, signing secrets, bearer tokens, polling tokens, unmasked or revealed values, bank numbers, or customer personal data. Summarize them as `present` or `redacted`.

Give each check and scenario one evidence level: `configured` (settings or code exist, nothing exercised them), `offline-tested` (a test in this run exercised it with the network stubbed), `synthetic` (a mock, a synthetic upstream, a delivery you signed yourself, or a Dashboard Testing or Svix Play example send), `live-observed` (Straddle Sandbox returned or delivered it in this run, for a resource this run created or reused), or `not verified`. Only `live-observed` rows are evidence of Straddle's behavior.

For a paykey, the resources table records its ID and status, never the token. The Sandbox scenarios table has one row per bank connection method in the plan, from its Bank connection methods table or, without one, its Decisions log's Bank connection answer, with its paykey ID and charge, or `not run` with the reason, and the handoff report names a skipped Bridge widget.

Write "None" for empty sections. Do not describe a scenario that did not run as passed. For an offline synthetic target, the server-side resources section lists synthetic upstream records only, and notification and lifecycle scenarios such as `paid`, the `R01` return, or delivered events are `not run: offline synthetic target`.

Tell the developer the result, the path, and what's next in two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md), leading with what passed and naming what didn't run and why. When a lifecycle scenario didn't run, also name the notification path its transitions must arrive through, what that path receives them with ([Endpoint types](../../straddle-best-practices/references/receiving-webhooks.md#endpoint-types)), such as the polling endpoint's consumer ID and committed offsets, and the ten-minute wait limit. Then print:

```markdown
## Verify before merging

- [ ] Every passed row in this run's section ran in this run, and earlier runs' sections are unchanged.
- [ ] Discovery and authenticated execution are reported separately.
- [ ] Status transitions came from the notification path, not resource polling.
- [ ] The evidence file contains no secret or unmasked data.
```

Then print on one line, followed by one or two short sentences: what finished, then what comes next:

```text
STRADDLE_HANDOFF {"skill":"straddle-test","status":"<passed|failed|partial|blocked>","report":"<one-paragraph summary including straddle-test-evidence.md and the scenarios not run>"}
```
