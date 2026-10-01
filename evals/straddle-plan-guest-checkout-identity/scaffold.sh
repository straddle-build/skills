#!/usr/bin/env bash
set -euo pipefail
mkdir -p src
cat > package.json <<'JSON'
{
  "name": "ridgeline-coffee",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" },
  "dependencies": { "@straddlecom/straddle": "1.0.4", "express": "4.21.2" }
}
JSON
cat > src/orders.ts <<'TS'
export type Order = {
  id: string;
  items: { sku: string; quantity: number }[];
  totalCents: number;
  guest: { name: string; email: string; phone: string };
  status: "awaiting_payment" | "paid" | "failed";
};

export const orders = new Map<string, Order>();
TS
cat > src/server.ts <<'TS'
import express from "express";
import { randomUUID } from "node:crypto";
import { orders } from "./orders.js";

const app = express();
app.use(express.json());

// Guest checkout: no accounts, no login. The form posts name, email, phone, and the cart.
app.post("/checkout", async (req, res) => {
  const { name, email, phone, items, totalCents } = req.body;
  const id = randomUUID();
  orders.set(id, { id, items, totalCents, guest: { name, email, phone }, status: "awaiting_payment" });
  // TODO: collect payment for the order from the shopper's bank account.
  res.status(501).json({ orderId: id, error: "payment not implemented" });
});

app.listen(3000);
TS
cat > AGENTS.md <<'MD'
Run tests with `npm test`. Keep handlers in src/.
MD
npm install --ignore-scripts --no-audit --no-fund --silent @straddlecom/straddle@1.0.4
