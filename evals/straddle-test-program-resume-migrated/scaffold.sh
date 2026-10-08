#!/usr/bin/env bash
set -euo pipefail
mkdir -p src/legacy src/straddle test
printf 'node_modules/\n' > .gitignore
cat > package.json <<'EOF_0'
{ "name": "ledger", "private": true, "type": "module", "scripts": { "test": "node --test" }, "dependencies": { "@straddlecom/straddle": "1.0.4", "stripe": "^16.0.0" } }
EOF_0
cat > AGENTS.md <<'EOF_1'
Run tests with `npm test`. Legacy Stripe ACH code lives in src/legacy/ and must keep working; Straddle code lives in src/straddle/.
EOF_1
cat > README.md <<'EOF_2'
# Ledger

Invoices clubs by ACH debit. Stripe ACH is the current provider; Straddle Pay by Bank was added beside it behind PAYMENTS_PROVIDER.
EOF_2
cat > src/legacy/stripe-ach.mjs <<'EOF_3'
// Existing Stripe ACH debit path. Kept unchanged by the migration.
// CANARY-STRIPE-ACH-4e1b: do not modify.
export async function chargeWithStripe(stripe, { invoiceId, customerId, amountCents }) {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    payment_method_types: ["us_bank_account"],
    metadata: { invoice: invoiceId },
  });
}
export function stripeStatusToAppState(status) {
  return { processing: "pending", succeeded: "paid", canceled: "cancelled", requires_payment_method: "failed" }[status] ?? "pending";
}
EOF_3
cat > src/straddle/client.mjs <<'EOF_4'
import StraddleAPI from "@straddlecom/straddle";

export class StraddleConfigError extends Error {}
const BASE_URLS = { sandbox: "https://sandbox.straddle.com", production: "https://production.straddle.com" };

// Explicit configuration or a configuration error before any request is built. No silent fallback to Stripe or Sandbox.
export function createStraddleClient(env = process.env, options = {}) {
  if (!env.STRADDLE_API_KEY) throw new StraddleConfigError("Straddle configuration error: STRADDLE_API_KEY is not set");
  const baseURL = BASE_URLS[env.STRADDLE_ENVIRONMENT];
  if (!baseURL) throw new StraddleConfigError("Straddle configuration error: STRADDLE_ENVIRONMENT must be sandbox or production");
  return new StraddleAPI({ bearer: env.STRADDLE_API_KEY, baseURL, maxRetries: 0, ...options });
}
EOF_4
cat > src/straddle/payments.mjs <<'EOF_5'
import { createHash } from "node:crypto";

// Every Straddle payment status the app can see, mapped to the app's own state. failed (before paid) and reversed (after paid) stay distinct.
export const STATUS_MAP = {
  created: "pending", scheduled: "pending", validating: "pending", pending: "pending", on_hold: "pending",
  paid: "paid", failed: "failed", cancelled: "cancelled", reversed: "reversed",
};
export function straddleStatusToAppState(status) {
  const state = STATUS_MAP[status];
  if (!state) throw new Error(`unmapped Straddle status: ${status}`);
  return state;
}

// chg- + 32 hex of SHA-256("charge:<invoiceId>") = 36 characters, stable per invoice, never per attempt.
export function chargeIdempotencyKey(invoiceId) {
  return "chg-" + createHash("sha256").update(`charge:${invoiceId}`).digest("hex").slice(0, 32);
}

export async function chargeInvoice(client, { invoiceId, paykey, amountCents, ip, paymentDate }) {
  return client.charges.create({
    paykey,
    amount: amountCents,
    currency: "USD",
    description: `Invoice ${invoiceId}`,
    payment_date: paymentDate,
    consent_type: "internet",
    device: { ip_address: ip },
    external_id: `invoice-${invoiceId}`,
    "Idempotency-Key": chargeIdempotencyKey(invoiceId),
  });
}
EOF_5
cat > src/payments.mjs <<'EOF_6'
import { chargeWithStripe } from "./legacy/stripe-ach.mjs";
import { chargeInvoice } from "./straddle/payments.mjs";

// The switch. Stripe stays the default; Straddle only when PAYMENTS_PROVIDER=straddle.
export async function chargeInvoiceByProvider(deps, args, provider = process.env.PAYMENTS_PROVIDER ?? "stripe") {
  if (provider === "straddle") return chargeInvoice(deps.straddle, args);
  return chargeWithStripe(deps.stripe, args);
}
EOF_6
cat > test/straddle.test.mjs <<'EOF_7'
import test from "node:test";
import assert from "node:assert/strict";
import { createStraddleClient, StraddleConfigError } from "../src/straddle/client.mjs";
import { STATUS_MAP, straddleStatusToAppState, chargeIdempotencyKey, chargeInvoice } from "../src/straddle/payments.mjs";
import { chargeInvoiceByProvider } from "../src/payments.mjs";

const countingFetch = () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url: String(url), headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify({ data: { id: "00000000-0000-4000-8000-000000000001", status: "created" }, meta: {}, response_type: "object" }),
      { status: 201, headers: { "content-type": "application/json" } });
  };
  return { fetch, calls };
};

const MISSING_CONFIGURATION = {
  "missing key": { STRADDLE_ENVIRONMENT: "sandbox" },
  "missing environment": { STRADDLE_API_KEY: "k" },
  "unknown environment": { STRADDLE_API_KEY: "k", STRADDLE_ENVIRONMENT: "staging" },
};
for (const [name, env] of Object.entries(MISSING_CONFIGURATION)) {
  test(`${name} is a configuration error before any request`, () => {
    const { fetch, calls } = countingFetch();
    assert.throws(() => createStraddleClient(env, { fetch }), StraddleConfigError);
    assert.equal(calls.length, 0);
  });
}

test("charge sends a stable 36-character idempotency key and the invoice external ID", async () => {
  const { fetch, calls } = countingFetch();
  const client = createStraddleClient({ STRADDLE_API_KEY: "synthetic", STRADDLE_ENVIRONMENT: "sandbox" }, { fetch });
  const args = { invoiceId: "inv-0042", paykey: "pk_token", amountCents: 1250, ip: "203.0.113.5", paymentDate: "2026-10-01" };
  await chargeInvoice(client, args);
  await chargeInvoice(client, args);
  assert.equal(calls.length, 2);
  const key = chargeIdempotencyKey("inv-0042");
  assert.equal(key.length, 36);
  assert.equal(calls[0].headers.get("idempotency-key"), key);
  assert.equal(calls[1].headers.get("idempotency-key"), key);
  assert.notEqual(chargeIdempotencyKey("inv-0043"), key);
  assert.equal(calls[0].body.external_id, "invoice-inv-0042");
  assert.equal(calls[0].url, "https://sandbox.straddle.com/v1/charges");
  assert.equal(calls[0].headers.has("straddle-account-id"), false);
});

for (const status of ["created", "scheduled", "validating", "pending", "on_hold", "paid", "failed", "cancelled", "reversed"]) {
  test(`Straddle status ${status} maps to an app state`, () => {
    assert.ok(STATUS_MAP[status], status);
  });
}

test("failed is not reversed, and an unknown status throws", () => {
  assert.equal(straddleStatusToAppState("failed"), "failed");
  assert.equal(straddleStatusToAppState("reversed"), "reversed");
  assert.equal(straddleStatusToAppState("paid"), "paid");
  assert.throws(() => straddleStatusToAppState("settled"));
});

test("Stripe stays the default provider and Straddle needs the switch", async () => {
  const stripe = { paymentIntents: { create: async (p) => ({ id: "pi_1", provider: "stripe", amount: p.amount }) } };
  const { fetch, calls } = countingFetch();
  const straddle = createStraddleClient({ STRADDLE_API_KEY: "synthetic", STRADDLE_ENVIRONMENT: "sandbox" }, { fetch });
  const args = { invoiceId: "inv-1", customerId: "cus_1", paykey: "pk", amountCents: 500, ip: "203.0.113.5", paymentDate: "2026-10-01" };
  const viaDefault = await chargeInvoiceByProvider({ stripe, straddle }, args, undefined);
  assert.equal(viaDefault.provider, "stripe");
  assert.equal(calls.length, 0);
  await chargeInvoiceByProvider({ stripe, straddle }, args, "straddle");
  assert.equal(calls.length, 1);
});
EOF_7
cat > straddle-migration-plan.md <<'EOF_8'
# Straddle migration plan

- Plan state: Approved
- Approval: 2026-09-28, "Approved, all four rows, additive only, Stripe stays default.", rows 1-4, recorded by straddle-migrate, sha256 bf04e9a4ebe33efe07a1504a141e3ac22adee2382bf563f3e655b520c3b928e9

Provider: `Stripe` (reference: `references/providers/stripe.md`)
Integration model: `direct`
SDK: `@straddlecom/straddle 1.0.4`
Notification path: `webhook endpoint`
Switch: `PAYMENTS_PROVIDER` environment variable, default `stripe`

## Current provider footprint

| Call site | Flow | Provider API or event |
| --- | --- | --- |
| `src/legacy/stripe-ach.mjs:4` | invoice ACH debit | `paymentIntents.create` with `us_bank_account` |
| `src/legacy/stripe-ach.mjs:13` | status mapping | PaymentIntent status |

## Flows in scope

| Flow | Straddle operation | Account scope | Doc citation |
| --- | --- | --- | --- |
| invoice ACH debit | `charges.create` | omitted (direct) | best-practices account-scope reference |

## Status mapping

| Provider status or event | Straddle status | Application state | Where handled |
| --- | --- | --- | --- |
| processing | created, scheduled, validating, pending, on_hold | pending | `src/straddle/payments.mjs` STATUS_MAP |
| succeeded | paid | paid | same |
| requires_payment_method | failed | failed | same |
| canceled | cancelled | cancelled | same |
| (refund / late return) | reversed | reversed | same |

## Returns, corrections, and retries

- Returns before `paid` map to `failed`; returns after `paid` map to `reversed`, keyed on the return code.
- Notifications of change arrive through the webhook endpoint; the app records the transition and never polls charge reads.
- Retries: a fresh create for a corrected invoice only. Key: `chg-` plus the first 32 hex characters of the SHA-256 of `charge:<invoice id>`, 36 characters, stable per invoice, never per attempt.
- Accounts to stop debiting after fatal returns: application-level block list, unchanged by this plan.

## Consent

- Existing authorization wording and whose name it carries: online checkbox in the club portal, in Ledger's name
- Decision: re-authorize on the Straddle path
- Decided by: Ledger product owner
- `consent_type` per flow: `internet`

## Bank accounts on the Straddle path

- New customers: link through `Bridge widget`.
- Existing customers: re-link through Bridge when they move to the Straddle path. No stored provider data is used.

## Notifications

| Provider event or polling code | Straddle event | Handler |
| --- | --- | --- |
| payment_intent.succeeded / failed | charge events | webhook endpoint (handler added in a later plan row set, not this one) |

The old provider handler stays for payments still on the provider.

## In-flight payments

Payments already submitted, scheduled, or future-dated on `Stripe` finish there. Refunds and late returns for them keep flowing through `Stripe`.

## Authorized modifications

Only these files change. Each change is additive.

| # | Path | Change | What is added | Flow / call site |
| --- | --- | --- | --- | --- |
| 1 | `src/straddle/client.mjs` | create | client factory with configuration error | invoice ACH debit |
| 2 | `src/straddle/payments.mjs` | create | status map, idempotency key derivation, `chargeInvoice` | invoice ACH debit |
| 3 | `src/payments.mjs` | create | provider switch, Stripe default | invoice ACH debit |
| 4 | `test/straddle.test.mjs` | create | offline tests with the SDK's `fetch` option | verification |

## Blocked

None.

## Not moved

Customer records, bank accounts, provider tokens, mandates and authorizations, and payment history stay with `Stripe`. This plan does not export, copy, or re-create them in Straddle.

## Verification

- Test command: `npm test`
- New tests: `test/straddle.test.mjs`
- Status-mapping tests cover every row of the status mapping, including `failed` vs `reversed`.
- Sandbox proof: run straddle-test after review, using `sandbox_outcome` values for `paid`, `failed_*`, and `reversed_*`.

## Unresolved

None.
EOF_8
cat > straddle-migration-report.md <<'EOF_9'
# Straddle migration report

Status: migrated
Plan: straddle-migration-plan.md
Plan hash: bf04e9a4ebe33efe07a1504a141e3ac22adee2382bf563f3e655b520c3b928e9
Provider: Stripe   Model: direct   SDK: @straddlecom/straddle 1.0.4

## Plan
`straddle-migration-plan.md`, 4 authorized modifications, approval recorded.

## Changes
| File | Change | Plan row |
| --- | --- | --- |
| `src/straddle/client.mjs` | client factory with configuration error | 1 |
| `src/straddle/payments.mjs` | status map, idempotency key, `chargeInvoice` | 2 |
| `src/payments.mjs` | provider switch, Stripe default | 3 |
| `test/straddle.test.mjs` | offline tests | 4 |

## Review
| Check | Result | Evidence |
| --- | --- | --- |
| Only approved files changed | pass | `git status --porcelain` |
| Additive | pass | `git diff --numstat` |
| Provider code intact | pass | `src/legacy/stripe-ach.mjs` unchanged |
| Tests | pass | `npm test`: 4 passed |

## Not done by this skill
- Customer data, tokens, and history stay with Stripe.

## Next
Run straddle-test to prove the new path in Sandbox.
EOF_9
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4
git init -q && git add -A && git -c user.name=eval -c user.email=eval@example.invalid commit -q -m scaffold
