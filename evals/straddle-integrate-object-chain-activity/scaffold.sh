#!/usr/bin/env bash
set -euo pipefail
mkdir -p src
cat > .gitignore <<'EOF_0'
node_modules/
EOF_0
cat > package.json <<'EOF_1'
{
  "name": "northwind-shop",
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
// In-memory store. Records keep the Straddle ids the app stored for them.
// users: { id, email, straddle_customer_id }
// bank_accounts: { id, user_id, straddle_paykey_id, paykey_token_encrypted }
// orders: { id, user_id, bank_account_id, amount_cents, straddle_charge_id }
// straddle_requests: { at, operation, resource_id, status, http_status }
// straddle_events: { at, event_id, type, data }
export function createDb() {
  return { users: new Map(), bank_accounts: new Map(), orders: new Map(), straddle_requests: [], straddle_events: [] };
}
EOF_3
cat > straddle-integration-plan.md <<'EOF_4'
# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-10-06, "The plan is approved.", recorded by straddle-plan, sha256 9a05adda42ce0fb605b52f51860434cb31a4b7aebdc2c39082bd6c7350856401
- SDK package and exact installed version: @straddlecom/straddle 1.0.4

## Decisions

| Decision | Value | Source |
| --- | --- | --- |
| Integration type | direct | developer |
| Products | Pay by Bank charges | developer |
| SDK | TypeScript | developer |
| Bank connection | Bridge bank account (`createBankAccountPaykey`) | developer |
| Notification path | webhook endpoint | developer |
| Your identifiers | customer `external_id` `nw-user-<user.id>`, `metadata` `{ app_user_id }`; Bridge token `external_id` `nw-pk-<user.id>`; paykey `external_id` `nw-pk-<user.id>`, `metadata` `{ app_user_id }`; charge `external_id` `nw-order-<order.id>`, `metadata` `{ order_id, app_user_id }` | developer, accepted recommended default |
| Read strategy | the order activity view correlates by the object chain from stored ids | developer |

## File changes

Only these files may change.

| File | Existing or new | Change |
| --- | --- | --- |
| src/straddle/client.mjs | new | SDK client built from STRADDLE_API_KEY and STRADDLE_ENVIRONMENT; configuration error when missing |
| src/straddle/payments.mjs | new | `createCustomer(client, db, user)`, `createBridgeToken(client, user)`, `createBankAccountPaykey(client, db, user, bank)`, `chargeOrder(client, db, order)`: send the approved identifiers, store each returned `id` on its record, and append one `straddle_requests` row per call |
| src/admin/order-activity.mjs | new | `orderActivity(db, orderId)`: every Straddle request and event for this order, oldest first |
| test/straddle.test.mjs | new | offline tests with the SDK fetch option |

## Future Sandbox writes

Each row runs only after its own preview and approval. Creates send an Idempotency-Key.

| Order | Operation |
| --- | --- |
| 1 | Create customer for user `u-42` (`createCustomer`, external_id `nw-user-u-42`) |
| 2 | Create bank-account paykey for that customer (`createBankAccountPaykey`, external_id `nw-pk-u-42`) |
| 3 | Create charge for order `o-1001` (`createCharge`, external_id `nw-order-o-1001`) |
EOF_4
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4
git init -q && git add -A && git -c user.name=eval -c user.email=eval@example.invalid commit -q -m scaffold
