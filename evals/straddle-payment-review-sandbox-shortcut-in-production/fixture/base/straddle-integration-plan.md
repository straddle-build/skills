# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-10-03, "approved, go ahead", recorded by straddle-plan, sha256 7928c02bd7501b5bc3582d76e0fad292c46394ddbda6530576f7627085b41f89

## Model

Direct integration. Walk owners pay for walks with a bank paykey. The app charges the order total stored on the server.

## Files

- `src/checkout.ts`: charge the order's stored total.
- `src/refunds.ts`: refund a walk by payout to the owner's paykey.
- `src/paykeys.ts`: link a bank account and store the paykey.
- `src/webhooks.ts`: verify and store charge events.
- `web/src/pay.ts`: browser checkout calls the app's own API.
