import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export interface Order {
  id: string;
  ownerId: string;
  amountCents: number;
  currency: "USD";
  paykey: string;
  chargeId?: string;
  tipChargeId?: string;
}

export interface ChargeChange {
  chargeId: string;
  status: string;
  changedAt: string;
  reason?: string;
  code?: string;
}

// A verified webhook event: the raw payload as delivered, plus the charge status change it carries, if any.
export interface StoredEvent {
  eventId: string;
  eventType: string;
  payload: string;
  charge?: ChargeChange;
}

// `status` is the charge's latest webhook status, or `unresolved` when two different statuses share the latest
// changed_at: a webhook endpoint has no delivery order, so such a tie can't be settled and is never fulfilled.
export interface ChargeStatus {
  chargeId: string;
  status: string;
  changedAt: string;
  reason: string | null;
  code: string | null;
}

export interface Store {
  getOrder(id: string): Order | undefined;
  saveOrder(order: Order): void;
  // Stores the event, and the status it carries, in one transaction. Returns false for an event already stored,
  // which changes nothing. Throws, with nothing stored, when a write fails, so the caller can answer 500 and Straddle
  // retries the delivery.
  recordEvent(event: StoredEvent): boolean;
  getChargeStatus(chargeId: string): ChargeStatus | undefined;
  close(): void;
}

// ISO timestamps carry 3 to 7 fractional digits, so compare them as UTC with the fraction padded to 9 digits.
function sortableTime(value: string): string {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) throw new Error(`invalid timestamp ${value}`);
  const fraction = /\.(\d+)/.exec(value)?.[1] ?? "";
  return `${time.toISOString().slice(0, 19)}.${fraction.padEnd(9, "0").slice(0, 9)}Z`;
}

export function openStore(path: string): Store {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, payload TEXT NOT NULL,
      charge_id TEXT, status TEXT, changed_at TEXT, reason TEXT, code TEXT);
    CREATE TABLE IF NOT EXISTS charge_status (
      charge_id TEXT PRIMARY KEY, status TEXT NOT NULL, changed_at TEXT NOT NULL, reason TEXT, code TEXT);
  `);
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (event_id, event_type, payload, charge_id, status, changed_at, reason, code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  // Every event stays in `events`, including ties and events for charges this app didn't create. The projected
  // status moves only forward in changed_at, so a late or repeated event never regresses it; a different status at
  // the same changed_at makes it `unresolved`.
  const projectStatus = db.prepare(`
    INSERT INTO charge_status (charge_id, status, changed_at, reason, code) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (charge_id) DO UPDATE SET
      status = CASE WHEN excluded.changed_at > charge_status.changed_at THEN excluded.status ELSE 'unresolved' END,
      reason = CASE WHEN excluded.changed_at > charge_status.changed_at THEN excluded.reason END,
      code = CASE WHEN excluded.changed_at > charge_status.changed_at THEN excluded.code END,
      changed_at = excluded.changed_at
    WHERE excluded.changed_at > charge_status.changed_at
      OR (excluded.changed_at = charge_status.changed_at AND excluded.status <> charge_status.status)`);
  const selectStatus = db.prepare("SELECT status, changed_at, reason, code FROM charge_status WHERE charge_id = ?");
  const selectOrder = db.prepare("SELECT body FROM orders WHERE id = ?");
  const upsertOrder = db.prepare("INSERT INTO orders (id, body) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET body = excluded.body");

  return {
    getOrder(id) {
      const row = selectOrder.get(id);
      return row ? (JSON.parse(String(row.body)) as Order) : undefined;
    },
    saveOrder(order) {
      upsertOrder.run(order.id, JSON.stringify(order));
    },
    recordEvent(event) {
      const charge = event.charge;
      const changedAt = charge ? sortableTime(charge.changedAt) : null;
      db.exec("BEGIN IMMEDIATE");
      try {
        const stored = insertEvent.run(
          event.eventId, event.eventType, event.payload,
          charge?.chargeId ?? null, charge?.status ?? null, changedAt, charge?.reason ?? null, charge?.code ?? null,
        ).changes > 0;
        if (stored && charge) projectStatus.run(charge.chargeId, charge.status, changedAt, charge.reason ?? null, charge.code ?? null);
        db.exec("COMMIT");
        return stored;
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    },
    getChargeStatus(chargeId) {
      const row = selectStatus.get(chargeId);
      if (!row) return undefined;
      return {
        chargeId,
        status: String(row.status),
        changedAt: String(row.changed_at),
        reason: row.reason === null ? null : String(row.reason),
        code: row.code === null ? null : String(row.code),
      };
    },
    close() {
      db.close();
    },
  };
}

let store: Store | undefined;
function defaultStore(): Store {
  store ??= openStore(process.env.DATABASE_PATH ?? "data/walkies.sqlite");
  return store;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return defaultStore().getOrder(id);
}

export async function saveOrder(order: Order): Promise<void> {
  defaultStore().saveOrder(order);
}

export async function recordEvent(event: StoredEvent): Promise<boolean> {
  return defaultStore().recordEvent(event);
}

export async function getChargeStatus(chargeId: string): Promise<ChargeStatus | undefined> {
  return defaultStore().getChargeStatus(chargeId);
}
