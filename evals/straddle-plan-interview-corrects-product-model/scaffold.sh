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
| Q1 | Integration type | direct (`account`) | developer | Only the club collects dues. |
| Q2 | Products | Pay by Bank charges only | developer | Members pay monthly dues; nothing is paid out. |
| Q3 | Bank connection | Bridge widget | developer | |
| Q4 | Notification path | webhook endpoint | developer | The server is already public over HTTPS. |
| Q5 | Identity mapping | open (round 2) | | |
| Q6 | Customer review | open (round 2) | | |
| Q7 | Paykey storage | open (round 2) | | |
| Q8 | Paykey review and R29 blocks | open (round 2) | | |
| Q9 | Consent | open (round 2) | | |
| Q10 | Duplicate events | open (round 2) | | |
| Q11 | Dues that come back after `paid` | open (round 2) | | |
| Q12 | Reconciliation | open (round 2) | | |

## Glossary

- None yet.

## Unresolved decisions

- None yet.
PLAN
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4
# history.jsonl loaded the skill from ~/.claude/plugins/cache/straddle/straddle/0.1.0, where an installed plugin lives.
# Link the plugin under test there so the resumed session can read the skill's files as a real one can.
plugin_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
mkdir -p "$HOME/.claude/plugins/cache/straddle/straddle"
ln -sfn "$plugin_root" "$HOME/.claude/plugins/cache/straddle/straddle/0.1.0"
