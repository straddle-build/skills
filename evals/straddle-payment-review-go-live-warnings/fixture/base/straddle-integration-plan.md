# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-10-03, "approved, go ahead", recorded by straddle-plan, sha256 PLANHASH

## Model

Direct integration on `@straddlecom/straddle` 1.0.4. Walk owners pay for walks with a bank paykey they linked during onboarding, outside this plan. The app charges the order total stored on the server, and a tip of the owner's choosing. Covered resources: charges.

## Notification path

Webhook endpoint at `/api/webhooks/straddle`, verified with the SDK's `webhooks.unwrap` on the raw body. Each verified event is stored with its charge status in one SQLite transaction before the `2xx`; status is projected by `status_details.changed_at`, per charge ID.

## Files

- `src/straddle.ts`: client from server configuration.
- `src/checkout.ts`: charge the order's stored total, and a tip.
- `src/webhooks.ts`: verify, store, and apply charge events.
- `src/db.ts`: orders and webhook events in a file-backed `node:sqlite` database (Node 24, single instance).
- `src/server.ts`: register the checkout and webhook routes.
- `test/db.test.ts`: event store checks.
- `package.json`, `README.md`: Node 24 and the test script.

## Future Sandbox writes

| # | Operation | External ID |
| --- | --- | --- |
| 1 | charges.create (paid) | order-sbx-0001 |
| 2 | charges.create (reversed_insufficient_funds) | order-sbx-0002 |
