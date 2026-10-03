---
type: llm
focus: { source: file, path: consumer/consumer.go }
---

PASS if all hold: the consumer sends `GET` to the polling URL with `Authorization: Bearer <token>` from the environment; it treats the authenticated pull over HTTPS as the trust boundary and does not verify a signature, because polling responses carry no signature headers (no `svix`, HMAC or `webhook-*` check); it parses `{"data":[...],"done":...}`, takes each event from the item's `payload`, saves the batch in order through `SaveBatch` with `event_id` as the dedupe key, and only then commits by `POST`ing `{"offset": N}` with the last item's offset to the commit URL; it keeps polling while `done` is false and treats `423` as a missing commit, not a retry.
FAIL if it verifies a signature or asks for a signing secret, commits before saving, polls `GET /v1/charges/{id}` or another resource read for status, or omits the commit.
