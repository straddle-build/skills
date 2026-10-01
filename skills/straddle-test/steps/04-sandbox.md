# Step 4: Sandbox scenarios

- **Needs:** step 3 summary with the approved rows.
- **Tools:** the selected SDK through the repository's code or test tooling; Bash for approved CLI commands with `--agent`; Read on the notification handler's stored events or the polling consumer's committed offset, and on [sandbox-outcomes.md](../../straddle-best-practices/references/sandbox-outcomes.md). No `execute-request` writes.
- **Next:** [05-verify.md](05-verify.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-test","step":"04-sandbox"}
```

Check configuration again before the first request. When it is missing, send nothing and go to step 5, which still records discovery.

Execute the approved rows as in Integrate's [execute step](../../straddle-integrate/steps/05-execute.md): the same reuse, returned-ID chaining, same-key recovery for unknown results, and stop-on-failure rules. Prefer the developer's application code path for the primary charge, so the test exercises what ships.

For each scenario, record the evidence below. A create response only shows that Straddle accepted the request, for a charge typically with status `created`. Record that as the resource's initial status. `paid`, `reversed`, and `R01` count only when they arrive through the notification path.

Compare each resource's delivered transitions with its observed path in [sandbox-outcomes.md](../../straddle-best-practices/references/sandbox-outcomes.md#states-and-transitions). A different path is a finding to report, not a pass.

- **Success.** Charge ID, acting account, and the `paid` transition as delivered through the notification path.
- **Failure and return.** Run the approved funding sweep row at the time [below](#funding-sweep-for-the-return). Record every delivered transition with its status, `data.status_details.changed_at`, return code, delivery position (polling offset, or FIFO batch and position), and separately its arrival time at the endpoint. It passes only when `paid` comes before `reversed` in the order [Ordering status changes](../../straddle-best-practices/references/receiving-webhooks.md#ordering-status-changes) defines, with delivery order breaking a `changed_at` tie, and the reversed status detail carries `R01`. When a transition's payload has no `changed_at`, or `paid` and `reversed` tie on a webhook endpoint, which has no delivery order, record the order as `not verified`. On a FIFO endpoint, assess arrival order as its own check.
- **Retry.** Repeat the exact create with the same idempotency key. It passes only when the repeated response returns the original resource ID, with `Idempotent-Replayed: true` when the response exposes it. Record the first and repeated responses' replay values separately. That live Sandbox response is the only evidence of server-side idempotency. A test or mock showing that the client resent the same key proves key preservation only. After an unknown result, an exact external-ID lookup that finds exactly one resource is recovery evidence that the resource exists once, not proof that the server enforced the key.
- **A/B switching.** Each result's account matches the account used for its request, and header-omitted operations were sent without the header. Take this from the application's request log or the SDK's `fetch` hook, not from inference.
- **Onboarding.** The API-created account resolved by exact external ID or by its account event, and used for an account-scoped payment.
- **Other matrix scenarios.** For each scenario taken from the matrix, the resource ID, acting account, and each transition its row names, as delivered through the notification path.
- **Notification.** Only events Straddle delivered count. Signed test deliveries you send to the receiver yourself prove the handler, which is step 2's row, not Straddle delivery or FIFO order. For each delivered event: `webhook-id` or `event_id`, event type, status, account ID, and whether the handler stored it once. Judge delivery against [Endpoint types](../../straddle-best-practices/references/receiving-webhooks.md#endpoint-types): a webhook endpoint returned `2xx` per event, a FIFO endpoint's batches passed `svix-*` verification and were stored whole and in order before each `2xx`, and a polling consumer committed each batch's last offset. For a FIFO endpoint, record the batch sizes. For a polling endpoint, record the consumer ID and offsets.

Wait at most ten minutes for transitions. Do not poll `GET /v1/charges/{id}`, payout, account, or list reads for status, and do not use `straddle tail`. When the window ends, record the missing transitions as `not observed`.

## Funding sweep for the return

Everything in this section was observed in Sandbox and is not a documented API contract. It is a Sandbox test recipe: never carry the sweep, its timing or its account-wide effect into production code or guidance.

In Sandbox, a `reversed_insufficient_funds` charge reaches `paid` only when a funding sweep runs after its funds are released and before its return. Without one it goes `pending`, then `failed` with no `paid`, on SaaS and marketplace alike.

- **Timing.** Send the approved sweep row 70 to 90 seconds after the charge's first `pending` transition, by that event's delivered `changed_at`. Observed in Sandbox: sweeps about 65 and 80 seconds after `pending` gave `paid`, then `reversed` with `R01`; one 47 seconds after gave `failed` with no `paid`. The return came about five minutes after `pending`. Straddle doesn't document this window.
- **Scope.** The sweep is account-wide. It funds every unfunded charge on the acting account, including other testers', and can re-emit `paid` events for earlier charges under new event IDs. Record the funding event's ID and how many payments it covered.

**Summary for step 5:** each scenario's result and evidence, and every server-side resource created, reused, or observed.
