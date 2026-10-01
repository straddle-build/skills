#!/usr/bin/env bash
set -euo pipefail
mkdir -p src
cat > package.json <<'JSON'
{
  "name": "acme-platform",
  "private": true,
  "type": "module",
  "dependencies": { "@straddlecom/straddle": "1.0.4", "express": "4.21.2" }
}
JSON
cat > src/server.ts <<'TS'
import express from "express";

export const app = express();
app.use(express.json());

app.listen(3000);
TS
cat > src/store.ts <<'TS'
export type StoredEvent = { eventId: string; eventType: string; accountId: string; body: unknown };

// Inserts every event in one transaction, in the given order, skipping event IDs already stored.
// Throws and inserts nothing when any write fails.
export async function saveEvents(events: StoredEvent[]): Promise<void> {
  throw new Error("wire to the database");
}
TS
