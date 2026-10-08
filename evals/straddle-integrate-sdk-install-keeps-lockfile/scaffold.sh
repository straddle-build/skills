#!/usr/bin/env bash
# A Node app whose approved plan has Integrate install the TypeScript SDK with npm (ME-918). The repository already
# has package-lock.json. The eval's Bash sandbox has no network, so the scaffold fills a project npm cache,
# .npm-cache/, and .npmrc makes every npm install in the workspace read only that cache.
set -euo pipefail
cache="$PWD/.npm-cache"
mkdir -p src test
printf 'node_modules/\n.npm-cache/\n' > .gitignore
cat > .npmrc <<'EOF_0'
# This machine has no network access: npm installs from the project cache.
cache=.npm-cache
offline=true
audit=false
fund=false
update-notifier=false
EOF_0
cat > package.json <<'EOF_1'
{
  "name": "tipjar",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" },
  "dependencies": { "ms": "2.1.3" }
}
EOF_1
cat > AGENTS.md <<'EOF_2'
Run tests with `npm test`. Application code lives in src/, tests in test/. The package manager is npm; this machine installs packages offline from the project cache.
EOF_2
cat > README.md <<'EOF_3'
# Tipjar

Records tips for baristas. Tips are recorded by hand today; Straddle Pay by Bank is being added as a direct integration.
EOF_3
cat > src/tips.mjs <<'EOF_4'
import ms from "ms";

// Tips recorded by hand. Straddle charges are added by Integrate in src/straddle/.
export function recordTip(ledger, { tipId, amountCents, at }) {
  if (amountCents <= 0) throw new Error("a tip must be for a positive amount");
  if (ledger.some((tip) => tip.tipId === tipId)) throw new Error(`tip ${tipId} is already recorded`);
  ledger.push({ tipId, amountCents, at });
}

export function tipAge(tip, now) {
  return ms(now - tip.at, { long: true });
}
EOF_4
cat > test/tips.test.mjs <<'EOF_5'
import test from "node:test";
import assert from "node:assert/strict";
import { recordTip, tipAge } from "../src/tips.mjs";

test("a tip is recorded once", () => {
  const ledger = [];
  recordTip(ledger, { tipId: "tip-1", amountCents: 300, at: 0 });
  assert.throws(() => recordTip(ledger, { tipId: "tip-1", amountCents: 300, at: 0 }));
  assert.equal(ledger.length, 1);
});

test("a tip's age reads in words", () => {
  assert.equal(tipAge({ at: 0 }, 2 * 60 * 60 * 1000), "2 hours");
});
EOF_5
cat > straddle-integration-plan.md <<'EOF_6'
# Straddle integration plan

## Status

- Plan state: Approved
- Approval: 2026-10-06, "The plan is approved.", recorded by straddle-plan, sha256 8b437fb38f5714d4254eb118dcbf04111972655f85c4f02569f74fa5d9bef575
- Last reviewed: 2026-10-06
- Repository and branch: tipjar, main
- Straddle skills version: 0.1.2
- API contract version: 1.0.4
- SDK package and exact installed version: @straddlecom/straddle 1.0.4, installed by Integrate with npm (not installed yet)

## Goal

Collect baristas' tips by bank account. One café, one Straddle account (direct integration), Pay by Bank charges only.

## Decisions

| Decision | Value | Source |
| --- | --- | --- |
| Integration type | direct (`account`) | developer |
| Products | charges | developer |
| Bank connection | bank account details | developer |
| SDK | TypeScript | developer |
| Notification path | webhook endpoint | developer |

## Repository evidence

- Language, framework, package manager: Node 22 ES modules, no framework, npm
- SDK install: `npm install --save-exact @straddlecom/straddle@1.0.4`, run by Integrate before the code changes
- Test command: `npm test`
- Existing payment or bank-linking providers to keep: hand-recorded tips in src/tips.mjs (`recordTip`, `tipAge`), unchanged
- Entry points where Straddle calls belong: src/straddle/
- Existing tests to extend: none; test/tips.test.mjs covers hand-recorded tips, stays unchanged and must keep passing

## Application flow

1. Create or reuse the tipper's customer by external ID.
2. Connect the tipper's bank account through Bridge with bank account details; the create returns the paykey `id` and the full token in `paykey`. Store the token encrypted, and never record it in this plan.
3. Create the tip charge with that token in `paykey`, consent, payment date, external ID, and idempotency key.
4. Receive status changes through the webhook endpoint.

## Account scope

| Operation | Header for this integration type | Source |
| --- | --- | --- |
| all | omitted (direct integrations never send Straddle-Account-Id) | best-practices account-scope reference |

## Configuration

- `STRADDLE_API_KEY` read from the process environment; a missing key or environment raises a configuration error before any request.
- Environment: Sandbox (`https://sandbox.straddle.com`), selected with `STRADDLE_ENVIRONMENT=sandbox`.

## File changes

| File | Existing or new | Change | Behavior proved | Test |
| --- | --- | --- | --- | --- |
| src/straddle/client.mjs | new | `createStraddleClient(env = process.env, options = {})` builds the SDK client from STRADDLE_API_KEY and STRADDLE_ENVIRONMENT, throwing `StraddleConfigError` (exported there) when either is missing or unknown | zero requests on missing configuration | test/straddle.test.mjs |
| src/straddle/tips.mjs | new | `chargeTip(client, { tipId, paykey, amountCents, ip, paymentDate })` creates the charge with external ID `tip-<tipId>` and a 10-40 character idempotency key derived from it | key and external ID on every create | test/straddle.test.mjs |
| test/straddle.test.mjs | new | unit tests with the SDK's `fetch` option, no network | configuration error, idempotency key, external ID | itself |

## Future Sandbox writes

| Order | Operation | Executing tool | Account | External ID | Idempotency key source |
| --- | --- | --- | --- | --- | --- |
| 1 | createCustomer | SDK `client.customers.create` | omitted | tipper-0001 | `cust-` + external ID |
| 2 | createBankAccountPaykey | SDK `client.bridge.createBankAccountPaykey` | omitted | tipper-0001 | `pk-` + external ID |
| 3 | createCharge (sandbox_outcome paid), paykey from row 2 `data.paykey` | SDK `client.charges.create` | omitted | tip-0001 | `chg-` + external ID |

## Verification

- Repository tests: `npm test`
- Sandbox success outcome: row 3 reaches `paid`
- Retry with the same idempotency key: repeat row 3, expect the same resource
- Notification proof: later, with the webhook handler

## Unresolved decisions

- None.

## Approval boundaries

- Approving this plan permits only the file changes listed above.
- Every Sandbox write needs its own preview and approval at the time it runs.
- The fourteen excluded operations run only through the SDK or the Straddle CLI.
EOF_6
# Fill the project cache with the app's dependency and the SDK from a throwaway install outside the workspace.
prime=$(mktemp -d)
(cd "$prime" && printf '{"name":"prime","private":true}\n' > package.json \
  && npm install --cache "$cache" --offline=false --ignore-scripts --no-audit --no-fund --silent ms@2.1.3 @straddlecom/straddle@1.0.4)
rm -rf "$prime"
# The developer's existing install: node_modules and package-lock.json with ms pinned, read from the cache.
npm install --ignore-scripts --silent
git init -q && git add -A && git -c user.name=eval -c user.email=eval@example.invalid commit -q -m scaffold
