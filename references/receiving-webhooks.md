# Receiving Straddle webhooks

Guidelines for writing, reviewing, or debugging a handler that consumes Straddle webhooks. Load this reference whenever an Integrate, Test, or Audit step touches a webhook handler.

Adapted from the MIT-licensed `receiving-webhooks` skill in [svix/ai](https://github.com/svix/ai/blob/main/skills/receiving-webhooks/SKILL.md), rewritten for Straddle. The original license is in [`third_party/LICENSES.md`](../third_party/LICENSES.md).

## How Straddle delivers events

A webhook is an HTTP POST from a source you don't control. Treat every request as untrusted until its signature is verified.

Straddle signs every delivery with the [Standard Webhooks](https://www.standardwebhooks.com) scheme and sends these headers:

| Concept | Header | Purpose |
| --- | --- | --- |
| Message ID | `webhook-id` | Unique identifier for the delivery. Reuse it to drop duplicates. |
| Timestamp | `webhook-timestamp` | Send time, used for replay protection. |
| Signature | `webhook-signature` | Space-separated `v1,<signature>` entries. |

Each endpoint has its own signing secret, prefixed `whsec_`. It is not your API key. Read it from the environment on the server, never from a client bundle or source control.

Event payloads carry `event_type` (for example `charge.event.v1`), a unique `event_id`, `account_id` on platform events, and the full resource under `data`. The event catalog is the `webhooks` section of the Straddle API contract.

Straddle offers three ways to receive events. Choose one in the plan; never poll an ordinary API read to discover state changes.

* **Webhook endpoint.** A public HTTPS URL. Deliveries are independent and ordering is best effort.
* **FIFO endpoint.** Same shape, delivered in strict order. Each delivery waits for the previous one to succeed, so throughput is lower.
* **Polling endpoint.** Your code fetches the event stream from a URL and token issued when you create the endpoint. Each message carries an `offset`, and each consumer ID tracks its own position. Use it when you cannot expose a public URL, for local development, or for batch processing.

## Routing events on a platform

For a direct integration the account is implicit, so events may carry no `account_id`. For a SaaS or marketplace platform, every event carries `account_id`, the embedded account the event belongs to. Route on that field. Do not infer the account from the endpoint URL, from the order events arrive in, or from IDs inside `data`. Reject an event that names an account your platform does not own.

## The non-negotiables

1. **Verify the signature on every request.** An unverified webhook is an anonymous internet POST. Anyone who learns your URL can forge events. Only act on payloads that pass verification.
2. **Verify against the raw request body.** The signature covers the exact bytes sent. Any framework that parses JSON and re-serializes it breaks verification. Read the unprocessed body.
3. **Return a `2xx` within seconds, but only after the event is safe.** A `2xx` tells Straddle the event is yours now; it will not be resent. Acknowledge only once the event is durably queued or its processing has been committed. Anything other than `2xx`, including `3xx` redirects, is treated as a failure and retried.
4. **Never treat a missing secret as "skip verification".** If the signing secret is not configured, fail the request with a configuration error. A handler that silently accepts unverified payments is worse than one that is down.

## Handler shape

1. **Read the raw body.** Do not parse JSON before verification.
2. **Verify** with the selected Straddle SDK's webhook helper when it has one. Otherwise use the `standardwebhooks` library for your language. Pass the raw body, the three headers, and the endpoint's signing secret. On failure return `400`.
3. **Persist, then acknowledge.** Write the verified event to a durable queue or table, or process it and commit, before responding. Only then return `2xx` (for example `204`). If the write fails, return `500` so Straddle retries. A `2xx` followed by a crash before persistence loses the event for good.
4. **Deduplicate.** Deliveries can repeat. Key the persisted record and your processing on `webhook-id` or the payload's `event_id` so a retry is a no-op.
5. **Branch on `event_type`** and process.

```ts
import { Webhook } from "standardwebhooks";

// rawBody must be the raw request body, not parsed JSON.
// secret is the endpoint's whsec_ signing secret from the environment.
if (!secret) {
  throw new Error("STRADDLE_WEBHOOK_SECRET is not configured");
}
const wh = new Webhook(secret);

let payload;
try {
  // Verifies the signature and the timestamp tolerance; throws on failure.
  payload = wh.verify(rawBody, req.headers);
} catch (err) {
  return res.status(400).send();
}

// payload is trusted. Make it durable before acknowledging.
try {
  await queue.enqueue({ id: req.headers["webhook-id"], payload });
} catch (err) {
  return res.status(500).send(); // not persisted; Straddle will retry
}
return res.status(204).send();
```

## Responding, retries, and auto-disable

* **Only `2xx` means success.** Every other code is treated as a failure and retried on a backoff schedule.
* **Respond within the delivery timeout.** Keep the work before the response to verify, persist, respond. Everything slower runs from the queue after the `2xx`.
* **Use `4xx` to reject bad or forged requests** (failed verification returns `400`). Use `5xx` or timeouts only for transient failures you want retried.
* **Endpoints auto-disable after sustained failure.** Keep the handler healthy and wire up failure notifications from the Straddle dashboard.

## Manual verification (only when no library exists)

Prefer the SDK helper or `standardwebhooks`. If your language has neither, follow the scheme exactly and do not invent your own:

1. Strip the `whsec_` prefix from the secret and base64-decode the remainder to get the HMAC key.
2. Read `webhook-id`, `webhook-timestamp`, and `webhook-signature`.
3. Reject if `webhook-timestamp` is more than five minutes from now.
4. Build the signed content as `{id}.{timestamp}.{body}` using the raw body bytes.
5. Compute HMAC-SHA256 of the signed content with the decoded key and base64-encode it.
6. Compare in constant time against each `v1,<sig>` entry in `webhook-signature`. Pass if any matches.

## Verification traps

* **Body parsed before verification.** Re-serialization changes the bytes. Use raw-body access.
* **Wrong secret.** Each endpoint has its own `whsec_` secret. Sandbox and production endpoints differ.
* **Secret in the wrong format.** Strip the prefix and base64-decode before use.
* **Replaying a captured payload with curl.** Verification rejects stale timestamps. Trigger a fresh delivery from the Straddle dashboard instead.
* **Reverse proxy stripping headers.** Confirm all three `webhook-*` headers reach the handler.
* **Clock skew.** Unsynced server time fails the timestamp check.

## Checklist

* Signature verified on every request with the SDK helper or `standardwebhooks`
* Verification runs against the raw body
* Missing secret is a configuration error, never a bypass
* Failed verification returns `400`
* Event is durably queued or committed before the `2xx`; a failed write returns `500`
* Handler responds within the timeout; slow work runs from the queue afterwards
* Processing is idempotent on `webhook-id` or `event_id`
* Signing secret is server-side only
