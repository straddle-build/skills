#!/usr/bin/env bash
set -euo pipefail
mkdir -p src
cat > package.json <<'JSON'
{
  "name": "club-dues",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" },
  "dependencies": { "@straddlecom/straddle": "1.0.4", "express": "4.21.2" }
}
JSON
cat > src/db.ts <<'TS'
export type Member = { id: string; email: string; name: string };
export type Dues = { id: string; memberId: string; amountCents: number; period: string; status: "unpaid" | "paid" };

export const members = new Map<string, Member>();
export const dues = new Map<string, Dues>();
TS
cat > src/server.ts <<'TS'
import express from "express";
import { dues } from "./db.js";

const app = express();
app.use(express.json());

app.post("/dues/:id/pay", async (req, res) => {
  const bill = dues.get(req.params.id);
  if (!bill) return res.status(404).end();
  // TODO: collect the dues from the member's bank account with Straddle.
  res.status(501).json({ error: "not implemented" });
});

app.listen(3000);
TS
cat > AGENTS.md <<'MD'
Club dues app. Members pay monthly dues. Run tests with `npm test`. Keep handlers in src/.
MD
cat > straddle-integration-plan.md <<'PLAN'
# Straddle integration plan

## Status

- Plan state: Draft
- Approval: none

## Decisions

| # | Decision | Answer | Source | Why |
| --- | --- | --- | --- | --- |
| | SDK | TypeScript, `@straddlecom/straddle` 1.0.4 | `package.json:6` | Already installed. |
| | Customer phone | every customer create sends `phone` in E.164; the member sign-up form collects it and stores it on the member (`Member` has none yet, `src/db.ts:1`) | `customers-identity.md` | Required on every customer create. |
| | Balance check | `config.balance_check: enabled` on every charge | `charges.md` | Checks the balance when it can, and still sends the charge when it can't. |
| Q1 | Integration type | direct (`account`) | developer | Only the club collects dues. |
| Q2 | Products | Pay by Bank charges only | developer | Members pay monthly dues; nothing is paid out. |
| Q3 | Bank connection | Bridge widget | developer | |
| Q4 | Notification path | webhook endpoint | developer | The server is already public over HTTPS. |
| Q5 | Identity mapping | one Straddle customer per member, `external_id` = member `id` | developer, accepted recommendation | Exact lookups that survive an email change. |
| Q6 | Customer review | wait for Straddle's decision; show "we're verifying your details"; a `rejected` member can't pay dues by bank and is asked to contact the club | developer, accepted recommendation | The club has no staff review queue. |
| Q7 | Paykey storage | paykey `id` and label on the member; token encrypted in its own column, never logged | developer, accepted recommendation | The token is a secret. |
| Q8 | Paykey review and R29 blocks | "verifying your bank account" during `review`; on `blocked`, stop charging and offer the one-time unblock only after the member confirms the debit | developer, accepted recommendation | There's no second unblock. |
| Q9 | Consent | `internet` consent with a checkbox on the pay page; store the text, time, and IP address | developer | |
| Q10 | Duplicate events | processed-events table keyed by `event_id`, checked before acting | developer, accepted recommendation | A redelivery changes nothing. |
| Q11 | App behavior per dues status | while the charge is `created`, `scheduled`, `on_hold`, or `pending`, the dues show "payment processing" and can't be paid again; on `paid`, mark the dues paid; on `failed` with `insufficient_funds` (an R01 or R09 return, or a failed balance check), resubmit once and keep showing "payment processing"; on another `failed` reason or `cancelled`, the dues stay unpaid and the member is emailed to pay again; on `reversed` after `paid`, mark the dues unpaid again, email the member, and resubmit once for R01 or R09 only | developer | `paid` isn't final for ACH. |
| Q12 | Reconciliation | record each charge's `funding_ids`; match deposits by funding event `id` | developer, accepted recommendation | The bank shows one line per funding event. |
| Q13 | Refunds and resubmits | no refunds through Straddle for now; resubmit only `insufficient_funds`, once | developer | The club doesn't refund dues. |
| Q14 | Your identifiers | customer `external_id` = member `id` (Q5); charge `external_id` = dues `id` with `metadata` `member_id` and `period`; the one resubmit uses `<dues id>-r1`; no Bridge session `external_id`, so paykey events are matched by the paykey `id` stored on the member (Q7) | developer, accepted recommendation | A dues `id` covers exactly one charge, and charge events return the member and period. |
| Q15 | Read strategy | dues and member status are stored on the app's records and updated only from webhook events; pages never call Straddle per row; the only direct read is a one-time lookup by exact `external_id` after an unclear create result | developer, accepted recommendation | Events drive state changes. |

## Glossary

- **Member**: a person who pays the club's dues. Each member is one Straddle customer. _Avoid_: user, account.
- **Dues**: one member's fee for one period, collected as one Straddle charge. _Avoid_: invoice, payment.

## Unresolved decisions

- None yet.
PLAN
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4
