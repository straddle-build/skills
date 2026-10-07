# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-10-03, "approved, go ahead", recorded by straddle-plan, sha256 PLANHASH

## Model

Direct integration on `@straddlecom/straddle` 1.0.4. Walk owners pay for walks with a bank paykey they linked during onboarding, outside this plan. The app charges the order total stored on the server, and a tip of the owner's choosing. Covered resources: charges.

## Notification path

Webhook endpoint at `/api/webhooks/straddle`, verified with the SDK's `webhooks.unwrap` on the raw body. Each verified event is stored with its charge status in one SQLite transaction before the `2xx`; status is projected by `status_details.changed_at`, per charge ID.

## Charge lifecycle

The app derives each charge's payment state from its projected status, separately for the walk charge and the tip charge, and shows it to the order's owner at `GET /api/orders/:id`. The walk is ready to fulfil only while its charge is `paid`. Recovery is manual: the app never creates another charge for an order, and support acts on the support action shown.

| Status | App state | What the app does |
| --- | --- | --- |
| `created`, `scheduled`, `pending`, or unrecognized | processing | Waits; checkout returns the existing charge. |
| `paid` | paid | Walk ready to fulfil; checkout returns the existing charge. |
| `on_hold`, `source` `user_action` | on_hold | Our own hold; checkout returns the existing charge. |
| `on_hold`, `source` `watchtower` | under_review | Shows "under review"; no release is promised. |
| `on_hold`, any other or missing `source` | needs_review | Not payable; support checks the hold in the dashboard. |
| `failed`, `reversed`, `cancelled` | same | Not payable; a reversal suspends fulfilment; checkout answers `409` with reason, code and support action, and makes no new charge. |
| Conflicting statuses at one `changed_at` | needs_review | Not payable; support checks the charge in the dashboard. |

Support action by `status_details.reason`: `insufficient_funds`, contact the owner and possibly resubmit once within Nacha's limits; `closed_bank_account` or `invalid_bank_account`, ask for another bank account; `frozen_bank_account`, stop; `payment_stopped`, contact the owner first; `disputed`, stop debiting and keep the authorization proof; anything else, contact support.

## Files

- `src/straddle.ts`: client from server configuration.
- `src/checkout.ts`: charge the order's stored total, and a tip; show the owner the walk and tip payment states.
- `src/webhooks.ts`: verify, store, and apply charge events.
- `src/db.ts`: orders and webhook events in a file-backed `node:sqlite` database (Node 24, single instance).
- `src/server.ts`: register the checkout and webhook routes.
- `test/db.test.ts`: event store and payment state checks.
- `package.json`, `README.md`: Node 24 and the test script.

## Future Sandbox writes

| # | Operation | External ID |
| --- | --- | --- |
| 1 | charges.create (paid) | order-sbx-0001 |
| 2 | charges.create (reversed_insufficient_funds) | order-sbx-0002 |
