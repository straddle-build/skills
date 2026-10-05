# Webhook events

Every status, field, and event type in backticks is checked against API contract 1.0.4 by `scripts/check-contract-tokens`. Facts marked "Observed in Sandbox" come from Sandbox runs, not from the contract or the docs. For details beyond this page, search the Docs MCP by concept, for example "webhook event catalog".

This page is what each event means for your app. How events are delivered, verified, deduplicated, and ordered is in [receiving-webhooks.md](receiving-webhooks.md), and how to choose an endpoint type is in [notifications.md](notifications.md).

## What it is

An event tells your app that a Straddle resource was created or changed. Every payload has the same envelope:

- `event_type`: the event name, such as `charge.event.v1`.
- `event_id`: unique per event. Deduplicate on it.
- `account_id`: the account the event belongs to. The contract marks it required on every event; route on it on platforms ([Routing events on a platform](receiving-webhooks.md#routing-events-on-a-platform)).
- `data`: the whole resource as it is now, not a diff.

Each resource has two events. The `.created.v1` event fires once on create. The `.event.v1` event fires on create too, and on every later change. Subscribe to the `.event.v1` events and handle a create arriving twice.

## States and transitions

The event catalog, by resource:

| Resource | Events | `data` | Your app |
| --- | --- | --- | --- |
| Customer | `customer.created.v1`, `customer.event.v1` | The customer | Gate paykeys and payments on `status`. Queue `review` ([customers-identity.md](customers-identity.md)). |
| Paykey | `paykey.created.v1`, `paykey.event.v1` | The paykey, with the full token | Use only `active` paykeys. Handle `review`, `blocked`, and `inactive` ([bridge-and-paykeys.md](bridge-and-paykeys.md)). |
| Charge | `charge.created.v1`, `charge.event.v1` | The charge | Fulfill on `paid`. Undo on `reversed` ([charges.md](charges.md)). |
| Payout | `payout.created.v1`, `payout.event.v1` | The payout, including refunds | Mark sent on `paid`. Restore on `failed` or `reversed` ([payouts.md](payouts.md)). |
| Funding event | `funding_event.created.v1`, `funding_event.event.v1` | The funding event | Reconcile ([funding-and-reconciliation.md](funding-and-reconciliation.md)). |
| Account | `account.created.v1`, `account.event.v1` | The account | Track onboarding and capabilities ([platforms.md](platforms.md)). |
| Representative | `representative.created.v1`, `representative.event.v1` | The representative | Track verification of the people behind an account. |
| Linked bank account | `linked_bank_account.created.v1`, `linked_bank_account.event.v1` | The linked bank account | Track the account used for funding. |
| Capability request | `capability_request.created.v1`, `capability_request.event.v1` | The capability request | Enable features when a request is approved. |

The account, representative, linked bank account, and capability request events matter only to SaaS and marketplace platforms. The contract also lists `platform.created.v1`, `platform.event.v1`, `user.created.v1`, and `user.event.v1`, and says they're for Straddle's own use. Ignore them.

Payload status lists differ from the REST ones. The webhook status list for charges, payouts, and funding events has no `validating`, and its `status_details.reason` list lacks five REST values: `cancel_request`, `failed_verification`, `require_review`, `blocked_by_system`, and `watchtower_review`. Observed in Sandbox: paykey reads returned `failed_verification` and `cancel_request`, so expect them in events too, even though the event schema doesn't list them. Accept values outside the lists and log them.

## What your app must handle

- Route every event by `event_type`, and store it before you act on it ([receiving-webhooks.md](receiving-webhooks.md)).
- Treat `data` as the resource's current state. Project it by `data.status_details.changed_at`, and never let an older change overwrite a newer one. An event without `changed_at`, such as the R29 paykey block events observed in Sandbox ([bridge-and-paykeys.md](bridge-and-paykeys.md#events-and-sandbox-outcomes)), is ordered by `data.updated_at` instead, never dropped.
- Handle each resource's whole lifecycle, not only the happy path: a charge handler that knows only `paid` misses `failed`, `reversed`, `on_hold`, and `cancelled`.
- Expect repeats: the same status under a new `event_id`, a create that arrives as both `.created.v1` and `.event.v1`, and redeliveries.
- Look up your own record from `data.external_id` or the resource `id`, and ignore events for resources your app didn't create. Paykey events have no `external_id`: match them by `data.id` against the paykey `id` you stored, or by an approved `metadata` key unique per paykey. `customer_id` only confirms the owner, because a customer can have several paykeys.
- Keep secrets out of logs: paykey events carry the full paykey token.

## Reading from Straddle

Events are the source of change. Keep a local projection of each resource from its events, and render pages, lists, and timer polls from that projection.

- Never read one customer, paykey, review, or charge per row in a list render or a poll loop. Read from Straddle only when an event or a review decision says that resource changed, or when a safety TTL on the cached value runs out.
- Clear a cached value on its resource's events and on your own review decisions, such as `setPaykeyVerificationDecision`, so the next read fetches it once.
- When you must read many, use one list with filters: `listPaykeys` takes `customer_id`, and `listPayments` takes `customer_id`, `paykey_id`, and `external_id`.
- A one-time read, such as reusing a resource by exact `external_id` or an independent check after a write, is fine. So is the polling endpoint, which is how you pull events ([notifications.md](notifications.md)).
- Rate limits are in [errors-and-limits.md](errors-and-limits.md).

## Events and Sandbox outcomes

Every `config.sandbox_outcome` in [sandbox-outcomes.md](sandbox-outcomes.md) produces the events for its path, so a Sandbox run can drive each handler. Payouts are the exception: Sandbox payouts never reach `paid` ([payouts.md](payouts.md#events-and-sandbox-outcomes)), so test those handlers with recorded payloads.
