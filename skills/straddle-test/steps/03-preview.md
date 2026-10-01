# Step 3: Sandbox preview and approval

- **Needs:** summaries from steps 1 and 2.
- **Tools:** Read, including [show-me.md](../../straddle-best-practices/references/show-me.md); AskUserQuestion; Bash only for `straddle ... --dry-run --agent` and `--help`, and only when step 1 recorded **configured**, and for `date -u +%Y-%m-%dT%H:%M:%SZ` to record the approval time. No live request.
- **Next:** [04-sandbox.md](04-sandbox.md) after an explicit yes. Otherwise [05-verify.md](05-verify.md), then [06-evidence.md](06-evidence.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-test","step":"03-preview"}
```

Show the flow the selected scenarios exercise as one small visual, following [show-me.md](../../straddle-best-practices/references/show-me.md), inline in your reply; write no file. For a SaaS or marketplace plan, it shows the requests as account A and account B and where the account header is sent or omitted, and for every plan, how each status arrives through the selected webhook, FIFO, or polling endpoint. Show it whether or not this run builds a preview, and add nothing the plan doesn't say.

When no selected scenario needs a Sandbox write, go to step 5.

Build and ask for approval exactly as in Integrate's [preview step](../../straddle-integrate/steps/04-preview.md). The same table, executing tools, idempotency keys, account rules, configuration handling, and approval rules apply. For Test, the rows are:

- reuse of accounts A and B, and of the customers and paykeys from Integrate, by exact external ID. Create only what is missing.
- one charge per selected outcome, each with a fresh external ID namespaced by run, for example `acme-test-<run>-paid-a` for account A and `acme-test-<run>-r01-b` for account B. Use `amount: 10000`, `currency: USD`, `consent_type: internet`, `config.balance_check: enabled`, today's date in US Eastern time as `payment_date` ([Payment dates](../../straddle-best-practices/references/writes-and-approval.md#payment-dates)), and the scenario's `config.sandbox_outcome` from [sandbox-outcomes.md](../../straddle-best-practices/references/sandbox-outcomes.md#states-and-transitions).
- for the customer review and paykey review scenarios, one customer or paykey created with the scenario's `config.sandbox_outcome`, and for the other matrix scenarios, the follow-up rows they name: the review decision, hold, release, cancel, refund, or resubmit. Each create has its own idempotency key and a fresh external ID.
- for a `reversed_insufficient_funds` charge, one funding sweep row: `simulateFundingEvent` (`POST /v1/funding_events/simulate`, `funding_event_job_type: charges`) through SDK `client.fundingEvents.simulate` or CLI `straddle funding-events create --funding-event-job-type charges`, for that charge's acting account, with its own idempotency key. It runs at the time [step 4](04-sandbox.md#funding-sweep-for-the-return) gives. The row says the sweep is account-wide, as step 4 describes, so an account nobody else is testing on is safer.
- the retry row, which repeats one create with the identical idempotency key and external ID
- the header-omitted operations the A/B scenario exercises

Name the notification path each status will arrive through, and the wait limit of ten minutes.

When the configuration is missing, the developer says no, or you are ending your turn to wait for an answer, send nothing. Record the Sandbox scenarios as `not run` with the reason (configuration error, denied, or awaiting approval of the preview above), print `STRADDLE_ABORT` when stopping for configuration or denial, and go to step 5, which still records discovery, then step 6 before ending the turn. A later explicit yes may continue at step 4 only if the exact preview and its environment, base URL, account, operation, and payload remain unchanged; otherwise show a new preview and obtain approval. Step 6 then updates the evidence.

**Summary for step 4:** the approved rows exactly as shown, or why Sandbox scenarios will not run.
