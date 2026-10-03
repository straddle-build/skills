#!/usr/bin/env bash
set -euo pipefail
mkdir -p src src/legacy src/lib src/straddle
cat > .gitignore <<'EOF_0'
node_modules/
EOF_0
cat > package.json <<'EOF_1'
{
  "name": "acme-app",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" },
  "dependencies": { "@straddlecom/straddle": "1.0.4" }
}
EOF_1
cat > AGENTS.md <<'EOF_2'
Run tests with `npm test`. Application code lives in src/.
EOF_2
cat > src/legacy/stripe-payments.mjs <<'EOF_3'
// Existing card provider. Keep as is; Straddle is added alongside it.
// CANARY-STRIPE-7f3a: do not modify.
export async function chargeCard(stripe, { amountCents, customerId }) {
  return stripe.paymentIntents.create({ amount: amountCents, currency: "usd", customer: customerId });
}
EOF_3
cat > src/lib/money.mjs <<'EOF_4'
// CANARY-MONEY-19c2: shared helper, unrelated to Straddle.
export const toCents = (dollars) => Math.round(Number(dollars) * 100);
EOF_4
cat > src/orders.mjs <<'EOF_5'
import { chargeCard } from "./legacy/stripe-payments.mjs";

export async function payOrder(deps, order) {
  if (order.method === "card") return chargeCard(deps.stripe, order);
  // TODO: Pay by Bank through Straddle for the order's seller.
  throw new Error("pay by bank not implemented");
}
EOF_5
cat > straddle-integration-plan.md <<'EOF_6'
# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-09-28, "The plan is approved.", recorded by straddle-plan, sha256 959be36c37cc8a64816793264385072c4c1d35db1a5e7342d1a02ca4e8b55e10
- SDK package and exact installed version: @straddlecom/straddle 1.0.4

## Decisions

| Decision | Value | Source |
| --- | --- | --- |
| Integration type | marketplace | developer |
| Products | Pay by Bank charges | developer |
| SDK | TypeScript | developer |
| Notification path | FIFO endpoint | developer |

## Accounts

- Account A: external ID `acme-kit-acct-a`, Straddle ID `11111111-1111-4111-8111-111111111111`
- Account B: external ID `acme-kit-acct-b`, Straddle ID `22222222-2222-4222-8222-222222222222`

## Account scope

Straddle-Account-Id: omitted on customer, paykey, and Bridge operations; required (seller account) on charge and payout creation; omitted on organization and account management.

## File changes

Only these files may change.

| File | Existing or new | Change |
| --- | --- | --- |
| src/straddle/client.mjs | existing | done |
| src/straddle/payments.mjs | existing | done |

## Future Sandbox writes

Each row runs only after its own preview and approval. Creates send an Idempotency-Key and an external ID.

| Order | Operation |
| --- | --- |
| 1 | Reuse or create organization `acme-kit-org` (SDK `client.organizations.create`) |
| 2 | Reuse or create accounts A and B (`acme-kit-acct-a`, `acme-kit-acct-b`) under that organization (SDK `client.accounts.create`) |
| 3 | Create buyer customer `acme-kit-buyer-1`, sandbox outcome verified (SDK `client.customers.create`, header omitted) |
| 4 | Create bank-account paykey for the buyer, sandbox outcome active (SDK `client.bridge.createBankAccountPaykey`, header omitted) |
| 5 | Reveal the buyer paykey's full token for the charges, used in-process and never printed (SDK `client.paykeys.reveal`, header omitted) |
| 6 | Create charge `order-a-0001` for seller A, sandbox outcome paid (SDK `client.charges.create`, account A) |
| 7 | Create charge `order-b-0001` for seller B, sandbox outcome reversed_insufficient_funds (SDK `client.charges.create`, account B) |
EOF_6
cat > src/straddle/client.mjs <<'EOF_7'
// Straddle SDK client (implemented by Integrate).
import StraddleAPI from "@straddlecom/straddle";

const LOCALHOST = /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/;

// Sandbox only. An explicit localhost STRADDLE_BASE_URL is the offline synthetic upstream.
export function createStraddleClient(env = process.env) {
  if (!env.STRADDLE_API_KEY) throw new Error("Straddle is not configured: missing STRADDLE_API_KEY");
  if (env.STRADDLE_ENVIRONMENT !== "sandbox") throw new Error("STRADDLE_ENVIRONMENT must be sandbox");
  const baseURL = LOCALHOST.test(env.STRADDLE_BASE_URL ?? "") ? env.STRADDLE_BASE_URL : "https://sandbox.straddle.com";
  return new StraddleAPI({ bearer: env.STRADDLE_API_KEY, baseURL, maxRetries: 0 });
}
EOF_7
cat > src/straddle/payments.mjs <<'EOF_8'
// Straddle payments (implemented by Integrate).
// Customer, paykey and reveal calls omit Straddle-Account-Id; charges carry the seller account.
const opts = (idempotencyKey, accountId) => ({ idempotencyKey, ...(accountId && { headers: { "Straddle-Account-Id": accountId } }) });

export const createBuyer = (client, { externalId, name, email, phone, ipAddress }) =>
  client.customers.create({ name, email, phone, type: "individual", device: { ip_address: ipAddress }, external_id: externalId }, opts(`cust-${externalId}`));

export const createBankPaykey = (client, { customerId, routingNumber, accountNumber, externalId }) =>
  client.bridge.createBankAccountPaykey({ customer_id: customerId, routing_number: routingNumber, account_number: accountNumber, account_type: "checking", external_id: externalId }, opts(`pk-${externalId}`));

// The create response masks the token; a charge needs the full one, used in-process and never logged.
export const revealPaykeyToken = async (client, paykeyId) => (await client.paykeys.reveal(paykeyId)).data.paykey;

export function chargeForSeller(client, { sellerAccountId, paykeyToken, amount, externalId, paymentDate, ipAddress }) {
  if (!sellerAccountId) throw new Error("seller account is required for a marketplace charge");
  return client.charges.create({
    paykey: paykeyToken, amount, currency: "USD", consent_type: "internet", description: `order ${externalId}`,
    payment_date: paymentDate, external_id: externalId, device: { ip_address: ipAddress }, config: { balance_check: "enabled" },
  }, opts(`chg-${externalId}`, sellerAccountId));
}
EOF_8
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4
git init -q && git add -A && git -c user.name=eval -c user.email=eval@example.invalid commit -q -m scaffold
