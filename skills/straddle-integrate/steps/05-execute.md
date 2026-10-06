# Step 5: Execute approved writes

- **Needs:** step 4 summary with the approved rows.
- **Tools:** the selected SDK through the repository's code or a script in its test tooling; Bash for the approved CLI commands with `--agent`; `straddle-api` `execute-request` only for permitted verification reads. Nothing else.
- **Next:** [06-review.md](06-review.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-integrate","step":"05-execute"}
```

Check configuration again before the first request, using the step 1 checks, and confirm the target (Straddle Sandbox, or the exact offline synthetic localhost URL) still matches the approved preview. For the offline synthetic target, also confirm that every condition in [offline-synthetic-target.md](../references/offline-synthetic-target.md) still holds, including the sandboxed, session-local localhost-only session. If the sandbox status is disabled or unknown, send nothing. When the key or a Sandbox environment is now missing, print `STRADDLE_ABORT` with `configuration error: <what is missing>`, send nothing, and continue at step 6, handing off with `blocked`.

Run the approved rows in order, exactly as previewed.

- **Reuse first.** For each create, do an exact external-ID lookup first when the preview says `reuse exact match`. Reuse one exact match, stop on several, and create only when there are none. For a paykey from the Bridge widget, the approved lookup is `listPaykeys` with the customer's `customer_id`, reading every page, then the one returned record whose `external_id` equals the app's stored value; stop on none or several. Its masked `paykey` never feeds a charge: use the token source the preview names.
- **Send what the preview promised.** Use the same idempotency key, external ID, acting account, and payload. When any value would differ, even an ID the lookup changes, stop and return to step 4 for a new approval.
- **Chain returned values by field meaning.** Pass each ID from the successful create response (`data.id`) to the ID fields that reference it. Do not rediscover IDs with list calls. For a charge or payout, the `paykey` field needs the full paykey token: the paykey create response's `data.paykey`, or for an existing paykey the approved reveal or unmasked-read row's result. Use it in the same SDK process or CLI command without printing it, per [Paykey tokens for charges and payouts](../references/execution-routes.md#paykey-tokens-for-charges-and-payouts).
- **Unknown results.** On a timeout, dropped connection, or `5xx` after sending, do not send a new create with a new key. Retry once with the same idempotency key, or do an exact external-ID lookup when the route has no key. If the result is still unknown, stop and report the row as `indeterminate` with its external ID.
- **Failures.** On a `4xx`, stop at that row. Report the status and error type without echoing request bodies that contain personal data, and do not continue with rows that depend on it.
- **Excluded reads** (unmask and reveal) run through the SDK or CLI only. Record that they succeeded, not what they returned.

Record, for every row: the operation, executing tool, acting account, external ID, idempotency key, the result status, the returned ID, and the approval time from step 4. Mark each resource `created` or `reused`. For an offline synthetic target, mark every row `synthetic upstream record`, and skip the notification endpoint and independent verification sections below, because neither exists offline.

## Notification endpoints

Webhook, FIFO, and polling endpoints are created and enabled in the Straddle dashboard by the developer. Ask the developer which endpoint they enabled and which events it subscribes to, and record that as a server-side resource. Do not create or change endpoints through the API or MCP. When the handler is reachable, ask the developer to trigger one Sandbox event for a resource this run created, or wait for the next status change, then confirm through the handler's stored events, or the polling consumer's committed offset, that the event was persisted once. A Dashboard Testing or Svix Play example send proves the handler, not Straddle delivery. Wait at most ten minutes. Never poll a charge or account read instead.

## Independent verification

Optionally verify created resources with one permitted read each, through the API MCP's `execute-request` or the SDK, passing the acting account where the read takes one. Record whether the read passed. Discovery calls (`summarize-openapi-specs`, `search-openapi-operations`) prove only discovery.

**Summary for step 6:** the row results table, every server-side resource created, reused, or enabled, and any `indeterminate` rows.
