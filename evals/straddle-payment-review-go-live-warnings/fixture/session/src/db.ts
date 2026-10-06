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
  source?: string;
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
  source: string | null;
}

// What the app shows and does for one charge. `payable` false means checkout must not treat the charge as paying
// for the order; recovery is manual, by support, following `supportAction`. The app never retries a charge itself.
export interface PaymentState {
  state: "none" | "processing" | "paid" | "under_review" | "on_hold" | "failed" | "reversed" | "cancelled" | "needs_review";
  payable: boolean;
  reason: string | null;
  code: string | null;
  source: string | null;
  supportAction: string | null;
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

// Support's next step for a charge that ended without paying, by status_details.reason (returns-and-disputes.md).
const SUPPORT_ACTION: Record<string, string> = {
  insufficient_funds: "Contact the owner; support may resubmit once within Nacha's reinitiation limits.",
  closed_bank_account: "Ask the owner to link another bank account; don't retry this one.",
  invalid_bank_account: "Ask the owner to correct or replace the bank account; don't retry this one.",
  frozen_bank_account: "Stop; don't retry this bank account.",
  payment_stopped: "Contact the owner before any new attempt.",
  disputed: "Stop debiting; keep the authorization proof for the dispute and get a new authorization first.",
};
const DEFAULT_SUPPORT_ACTION = "Contact support; no new charge is made automatically.";

// Derives the app-visible payment state from a charge's projected status. Only `paid` is paid. Only a `user_action`
// hold is the app's own and only a `watchtower` hold is Straddle's review; a hold from any other or missing source is
// needs_review, so the app never promises a release it can't make. An unknown status is still processing.
export function paymentState(status: ChargeStatus | undefined): PaymentState {
  const details = { reason: status?.reason ?? null, code: status?.code ?? null, source: status?.source ?? null };
  switch (status?.status) {
    case undefined:
      return { state: "none", payable: true, reason: null, code: null, source: null, supportAction: null };
    case "paid":
      return { state: "paid", payable: true, ...details, supportAction: null };
    case "on_hold":
      if (details.source === "user_action") return { state: "on_hold", payable: true, ...details, supportAction: null };
      if (details.source === "watchtower") return { state: "under_review", payable: true, ...details, supportAction: null };
      return { state: "needs_review", payable: false, ...details, supportAction: "Support checks the hold in the Straddle dashboard; don't promise a release." };
    case "failed":
    case "reversed":
    case "cancelled":
      return { state: status.status, payable: false, ...details, supportAction: SUPPORT_ACTION[details.reason ?? ""] ?? DEFAULT_SUPPORT_ACTION };
    case "unresolved":
      return { state: "needs_review", payable: false, ...details, supportAction: "Support checks the charge in the Straddle dashboard before anything else happens." };
    default:
      return { state: "processing", payable: true, ...details, supportAction: null };
  }
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
      charge_id TEXT, status TEXT, changed_at TEXT, reason TEXT, code TEXT, source TEXT);
    CREATE TABLE IF NOT EXISTS charge_status (
      charge_id TEXT PRIMARY KEY, status TEXT NOT NULL, changed_at TEXT NOT NULL, reason TEXT, code TEXT, source TEXT);
  `);
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (event_id, event_type, payload, charge_id, status, changed_at, reason, code, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  // Every event stays in `events`, including ties and events for charges this app didn't create. The projected
  // status moves only forward in changed_at, so a late or repeated event never regresses it; a different status at
  // the same changed_at makes it `unresolved`.
  const projectStatus = db.prepare(`
    INSERT INTO charge_status (charge_id, status, changed_at, reason, code, source) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (charge_id) DO UPDATE SET
      status = CASE WHEN excluded.changed_at > charge_status.changed_at THEN excluded.status ELSE 'unresolved' END,
      reason = CASE WHEN excluded.changed_at > charge_status.changed_at THEN excluded.reason END,
      code = CASE WHEN excluded.changed_at > charge_status.changed_at THEN excluded.code END,
      source = CASE WHEN excluded.changed_at > charge_status.changed_at THEN excluded.source END,
      changed_at = excluded.changed_at
    WHERE excluded.changed_at > charge_status.changed_at
      OR (excluded.changed_at = charge_status.changed_at AND excluded.status <> charge_status.status)`);
  const selectStatus = db.prepare("SELECT status, changed_at, reason, code, source FROM charge_status WHERE charge_id = ?");
  const selectOrder = db.prepare("SELECT body FROM orders WHERE id = ?");
  const upsertOrder = db.prepare("INSERT INTO orders (id, body) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET body = excluded.body");
  const text = (value: unknown) => (value === null || value === undefined ? null : String(value));

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
      const reason = charge?.reason ?? null;
      const code = charge?.code ?? null;
      const source = charge?.source ?? null;
      db.exec("BEGIN IMMEDIATE");
      try {
        const stored = insertEvent.run(
          event.eventId, event.eventType, event.payload,
          charge?.chargeId ?? null, charge?.status ?? null, changedAt, reason, code, source,
        ).changes > 0;
        if (stored && charge) projectStatus.run(charge.chargeId, charge.status, changedAt, reason, code, source);
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
        reason: text(row.reason),
        code: text(row.code),
        source: text(row.source),
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

export async function getPaymentState(chargeId: string | undefined): Promise<PaymentState> {
  return paymentState(chargeId ? defaultStore().getChargeStatus(chargeId) : undefined);
}
