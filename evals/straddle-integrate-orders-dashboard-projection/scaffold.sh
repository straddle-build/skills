#!/usr/bin/env bash
set -euo pipefail
mkdir -p src
cat > .gitignore <<'EOF_0'
node_modules/
EOF_0
cat > package.json <<'EOF_1'
{
  "name": "northwind-backoffice",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" },
  "dependencies": { "@straddlecom/straddle": "1.0.4" }
}
EOF_1
cat > AGENTS.md <<'EOF_2'
Run tests with `npm test`. Application code lives in src/.
EOF_2
cat > src/db.mjs <<'EOF_3'
// In-memory store. The webhook handler keeps the Straddle projection current.
export function createDb() {
  const orders = new Map(); // id -> { id, straddle_customer_id, straddle_charge_id, amount_cents }
  const customerProjection = new Map(); // straddle customer id -> { id, status, updated_at }
  const chargeProjection = new Map(); // straddle charge id -> { id, status, status_details, updated_at }
  return {
    listOrders: () => [...orders.values()],
    putOrder: (order) => orders.set(order.id, order),
    getCustomerProjection: (id) => customerProjection.get(id),
    putCustomerProjection: (row) => customerProjection.set(row.id, row),
    getChargeProjection: (id) => chargeProjection.get(id),
    putChargeProjection: (row) => chargeProjection.set(row.id, row),
  };
}
EOF_3
cat > straddle-integration-plan.md <<'EOF_4'
# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-10-06, "The plan is approved.", recorded by straddle-plan, sha256 b882409dbf9000764868ffd4c8eb799d1f9015f3e5dac09c5875fafd6d098a6f
- SDK package and exact installed version: @straddlecom/straddle 1.0.4

## Decisions

| Decision | Value | Source |
| --- | --- | --- |
| Integration type | direct | developer |
| Products | Pay by Bank charges | developer |
| SDK | TypeScript | developer |
| Customer review | our team decides customers in `review` from the back office | developer |
| Notification path | webhook endpoint | developer |
| Duplicate events | event ids kept in memory beside the projection | developer |
| Read strategy | local projection fed by `customer.event.v1` and `charge.event.v1`; customer review details cached per customer, cleared by that customer's events and by our review decisions, with a 5-minute safety TTL; no per-row reads | developer, accepted recommended default |

## File changes

Only these files may change.

| File | Existing or new | Change |
| --- | --- | --- |
| src/straddle/client.mjs | new | SDK client built from STRADDLE_API_KEY and STRADDLE_ENVIRONMENT; configuration error when missing |
| src/straddle/review-cache.mjs | new | `createReviewCache(client, { ttlMs })` with `get(customerId)` (`getCustomerReview` on a miss or an expired entry) and `clear(customerId)` |
| src/webhooks/straddle.mjs | new | verified webhook handler: update the customer and charge projection in `src/db.mjs`, drop duplicate event ids, and clear the customer's review-cache entry on `customer.event.v1` |
| src/admin/orders-dashboard.mjs | new | `ordersDashboard(db)`: one row per order with the customer status and charge status. The back-office page polls it every 3 seconds for about 80 orders |
| src/admin/review-decision.mjs | new | `decideCustomerReview(client, cache, customerId, decision)`: send our team's decision, then clear that customer's review-cache entry |
| test/straddle.test.mjs | new | offline tests with the SDK fetch option |

## Future Sandbox writes

Each row runs only after its own preview and approval. Creates send an Idempotency-Key and an external ID.

| Order | Operation |
| --- | --- |
| 1 | Create customer `nw-user-u-42`, sandbox outcome review (`createCustomer`) |
| 2 | Decide that customer's review (`setCustomerVerificationDecision`) |
EOF_4
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4
git init -q && git add -A && git -c user.name=eval -c user.email=eval@example.invalid commit -q -m scaffold
