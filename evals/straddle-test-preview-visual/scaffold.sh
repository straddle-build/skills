#!/usr/bin/env bash
set -euo pipefail
mkdir -p src test
cat > package.json <<'EOF_0'
{
  "name": "acme-market",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" },
  "dependencies": { "@straddlecom/straddle": "1.0.4", "standardwebhooks": "1.0.0" }
}
EOF_0
cat > .gitignore <<'EOF_1'
node_modules/
EOF_1
cat > AGENTS.md <<'EOF_2'
Run tests with `npm test`. Application code lives in src/.
EOF_2
cat > straddle-integration-plan.md <<'EOF_3'
# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-09-28, "The plan is approved.", recorded by straddle-plan, sha256 47f9b751b5b916a8f65e3f3119ecadc689805e1fd681838a810bd3a3825d1675
- SDK package and exact installed version: @straddlecom/straddle 1.0.4

## Decisions

| Decision | Value | Source |
| --- | --- | --- |
| Integration type | marketplace | developer |
| Products | Pay by Bank charges | developer |
| SDK | TypeScript | developer |
| Notification path | webhook endpoint | developer |

## Accounts

- Account A: external ID `acme-kit-acct-a`, Straddle ID `11111111-1111-4111-8111-111111111111`
- Account B: external ID `acme-kit-acct-b`, Straddle ID `22222222-2222-4222-8222-222222222222`

## Account scope

Straddle-Account-Id: omitted on customer, paykey, and Bridge operations; required (seller account) on charge and payout creation; omitted on organization and account management.

## File changes

Only these files may change.

| File | Existing or new | Change |
| --- | --- | --- |
| src/config.mjs | new | configuration |
| src/straddle.mjs | new | SDK calls |
| src/webhooks.mjs | new | webhook handler |
| test/straddle.test.mjs | new | offline tests |

## Future Sandbox writes

Each row runs only after its own preview and approval. Creates send an Idempotency-Key and an external ID.

| Order | Operation |
| --- | --- |
| 1 | Reuse or create organization `acme-kit-org` (SDK `client.organizations.create`) |
| 2 | Reuse or create accounts A and B (`acme-kit-acct-a`, `acme-kit-acct-b`) under that organization (SDK `client.accounts.create`) |
| 3 | Create buyer customer `acme-kit-buyer-1`, sandbox outcome verified (SDK `client.customers.create`, header omitted) |
| 4 | Create bank-account paykey for the buyer, sandbox outcome active (SDK `client.bridge.createBankAccountPaykey`, header omitted) |
| 5 | Create charge `order-a-0001` for seller A, sandbox outcome paid (SDK `client.charges.create`, account A) |
| 6 | Create charge `order-b-0001` for seller B, sandbox outcome reversed_insufficient_funds (SDK `client.charges.create`, account B) |

## Verification

- Repository tests: `npm test` (offline, SDK fetch option records requests)
- Configuration error with zero requests; marketplace header omitted on customers; seller account on charges; A-to-B switching; missing seller fails locally with zero requests
- Sandbox: charge paid for seller A; charge reversed_insufficient_funds for seller B (paid, then reversed with R01); retry with the same idempotency key
- Notification proof through the selected endpoint; no status polling
EOF_3
cat > src/config.mjs <<'EOF_4'
export class StraddleConfigError extends Error {}

const BASE_URLS = {
  sandbox: "https://sandbox.straddle.com",
  production: "https://production.straddle.com",
};
// An explicit localhost STRADDLE_BASE_URL is the offline synthetic upstream; any other value leaves the environment's URL.
const LOCALHOST = /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/;

// Missing configuration is an error before any request, never a silent no-op.
export function loadStraddleConfig(env = process.env) {
  const missing = [];
  if (!env.STRADDLE_API_KEY) missing.push("STRADDLE_API_KEY");
  if (!env.STRADDLE_ENVIRONMENT) missing.push("STRADDLE_ENVIRONMENT");
  if (missing.length) throw new StraddleConfigError(`Straddle is not configured: missing ${missing.join(", ")}`);
  if (!BASE_URLS[env.STRADDLE_ENVIRONMENT]) throw new StraddleConfigError(`STRADDLE_ENVIRONMENT must be sandbox or production`);
  const baseURL = LOCALHOST.test(env.STRADDLE_BASE_URL ?? "") ? env.STRADDLE_BASE_URL : BASE_URLS[env.STRADDLE_ENVIRONMENT];
  return { apiKey: env.STRADDLE_API_KEY, environment: env.STRADDLE_ENVIRONMENT, baseURL };
}
EOF_4
cat > src/straddle.mjs <<'EOF_5'
import StraddleAPI from "@straddlecom/straddle";
import { loadStraddleConfig } from "./config.mjs";

export class MissingSellerAccountError extends Error {}

export function createStraddleClient({ env, fetch } = {}) {
  const config = loadStraddleConfig(env);
  return new StraddleAPI({ bearer: config.apiKey, baseURL: config.baseURL, fetch, maxRetries: 0 });
}

// Marketplace: the platform owns buyers, so customer calls omit Straddle-Account-Id.
export function createBuyer(client, { externalId, name, email, phone, ipAddress }) {
  return client.customers.create({
    "Idempotency-Key": `cust-${externalId}`.slice(0, 40),
    name, email, phone, type: "individual",
    device: { ip_address: ipAddress },
    external_id: externalId,
  });
}

// Marketplace seller-attributed charge: the seller account is required.
export function chargeForSeller(client, { sellerAccountId, paykey, amount, externalId, paymentDate, ipAddress }) {
  if (!sellerAccountId) throw new MissingSellerAccountError("seller account is required for a marketplace charge");
  return client.charges.create({
    "Straddle-Account-Id": sellerAccountId,
    "Idempotency-Key": `chg-${externalId}`.slice(0, 40),
    paykey, amount, currency: "USD", consent_type: "internet",
    description: `order ${externalId}`, payment_date: paymentDate,
    external_id: externalId,
    device: { ip_address: ipAddress },
    config: { balance_check: "enabled" },
  });
}
EOF_5
cat > src/webhooks.mjs <<'EOF_6'
// Verify from the raw body, persist, then acknowledge. Duplicate deliveries are no-ops.
export async function handleStraddleDelivery(client, { rawBody, headers, secret, store }) {
  if (!secret) throw new Error("STRADDLE_WEBHOOK_SECRET is not configured");
  if (!headers) return { status: 400 };
  let event;
  try {
    event = client.webhooks.unwrap(rawBody, { headers, key: secret });
  } catch {
    return { status: 400 };
  }
  const id = headers["webhook-id"];
  try {
    if (!(await store.has(id))) await store.put(id, event);
  } catch {
    return { status: 500 };
  }
  return { status: 204 };
}
EOF_6
cat > test/straddle.test.mjs <<'EOF_7'
import test from "node:test";
import assert from "node:assert/strict";
import { Webhook } from "standardwebhooks";
import { createStraddleClient, createBuyer, chargeForSeller, MissingSellerAccountError } from "../src/straddle.mjs";
import { StraddleConfigError } from "../src/config.mjs";
import { handleStraddleDelivery } from "../src/webhooks.mjs";

const ENV = { STRADDLE_API_KEY: "synthetic-test-key", STRADDLE_ENVIRONMENT: "sandbox" };
const SELLER_A = "11111111-1111-4111-8111-111111111111";
const SELLER_B = "22222222-2222-4222-8222-222222222222";

function recorder() {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method, headers: new Headers(init.headers) });
    return new Response(JSON.stringify({ data: { id: "00000000-0000-4000-8000-000000000000" }, meta: {}, response_type: "object" }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  return { calls, fetch };
}

const buyer = { externalId: "buyer-001", name: "Test Buyer", email: "buyer@example.com", phone: "+15555550100", ipAddress: "192.0.2.1" };
const charge = (sellerAccountId, externalId) => ({ sellerAccountId, paykey: "synthetic-paykey", amount: 10000, externalId, paymentDate: "2026-10-01", ipAddress: "192.0.2.1" });

test("missing key or environment fails before any request", () => {
  const r = recorder();
  assert.throws(() => createStraddleClient({ env: {}, fetch: r.fetch }), StraddleConfigError);
  assert.throws(() => createStraddleClient({ env: { STRADDLE_API_KEY: "k" }, fetch: r.fetch }), /STRADDLE_ENVIRONMENT/);
  assert.equal(r.calls.length, 0);
});

test("marketplace customer create omits Straddle-Account-Id and sends an idempotency key", async () => {
  const r = recorder();
  await createBuyer(createStraddleClient({ env: ENV, fetch: r.fetch }), buyer);
  assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].headers.get("straddle-account-id"), null);
  assert.equal(r.calls[0].headers.get("idempotency-key"), "cust-buyer-001");
  assert.match(r.calls[0].url, /^https:\/\/sandbox\.straddle\.com\/v1\/customers/);
});

test("a localhost STRADDLE_BASE_URL is the request target; any other host is not", async () => {
  const r = recorder();
  await createBuyer(createStraddleClient({ env: { ...ENV, STRADDLE_BASE_URL: "http://127.0.0.1:45871" }, fetch: r.fetch }), buyer);
  await createBuyer(createStraddleClient({ env: { ...ENV, STRADDLE_BASE_URL: "https://example.com" }, fetch: r.fetch }), buyer);
  assert.match(r.calls[0].url, /^http:\/\/127\.0\.0\.1:45871\/v1\/customers/);
  assert.match(r.calls[1].url, /^https:\/\/sandbox\.straddle\.com\/v1\/customers/);
});

test("seller charges carry the selected account, switching A to B", async () => {
  const r = recorder();
  const client = createStraddleClient({ env: ENV, fetch: r.fetch });
  await chargeForSeller(client, charge(SELLER_A, "order-a-001"));
  await chargeForSeller(client, charge(SELLER_B, "order-b-001"));
  assert.deepEqual(r.calls.map((c) => c.headers.get("straddle-account-id")), [SELLER_A, SELLER_B]);
});

test("missing seller account fails locally with zero requests", async () => {
  const r = recorder();
  const client = createStraddleClient({ env: ENV, fetch: r.fetch });
  assert.throws(() => chargeForSeller(client, charge(undefined, "order-x-001")), MissingSellerAccountError);
  assert.equal(r.calls.length, 0);
});

test("webhook: signed delivery persisted once, duplicate ignored, forged rejected", async () => {
  const secret = "whsec_" + Buffer.from("synthetic-signing-secret-000000").toString("base64");
  const client = createStraddleClient({ env: ENV, fetch: recorder().fetch });
  const seen = new Map();
  const store = { has: async (k) => seen.has(k), put: async (k, v) => void seen.set(k, v) };
  const body = JSON.stringify({ event_type: "charge.event.v1", event_id: "e1", account_id: SELLER_A, data: { status: "paid" } });
  const ts = new Date();
  const headers = { "webhook-id": "msg_1", "webhook-timestamp": String(Math.floor(ts / 1000)), "webhook-signature": new Webhook(secret).sign("msg_1", ts, body) };
  assert.equal((await handleStraddleDelivery(client, { rawBody: body, headers, secret, store })).status, 204);
  assert.equal((await handleStraddleDelivery(client, { rawBody: body, headers, secret, store })).status, 204);
  assert.equal(seen.size, 1);
  assert.equal((await handleStraddleDelivery(client, { rawBody: body + " ", headers, secret, store })).status, 400);
  assert.equal((await handleStraddleDelivery(client, { rawBody: body, headers: undefined, secret, store })).status, 400);
});
EOF_7
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4 standardwebhooks@1.0.0
git init -q && git add -A && git -c user.name=eval -c user.email=eval@example.invalid commit -q -m scaffold
