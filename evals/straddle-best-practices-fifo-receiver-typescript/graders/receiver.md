---
type: llm
focus: { source: file, path: src/fifo.ts }
---

PASS if all hold: the route reads the raw body (for example `express.raw` on the route, not the app-wide `express.json()` parser) and verifies it before parsing, with the `svix` library (`new Webhook(secret).verify(rawBody, headers)`) or a manual check that reads `svix-id`, `svix-timestamp` and `svix-signature`; the secret comes from the environment and a missing secret is a configuration error; failed verification returns `400`; the verified body is parsed as a batch envelope `{"data":[{"payload":{...},"eventType":"..."}]}`, taking each event from `data[i].payload`; all events are passed to `saveEvents` in batch order with `event_id` as the dedupe key and `account_id` kept; `2xx` is returned only after the whole batch is saved, and a save failure returns `500`.
FAIL if it verifies only `webhook-*` headers, uses the Straddle SDK's `unwrap` or `standardwebhooks`, parses the body as one event or as a bare array, parses JSON before verifying, or acknowledges before the batch is saved.
