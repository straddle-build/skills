import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { openStore } from "../src/db.ts";

const freshPath = () => join(mkdtempSync(join(tmpdir(), "walkies-db-")), "walkies.sqlite");
const event = (eventId: string, chargeId: string, status: string, changedAt: string) => ({
  eventId,
  eventType: "charge.event.v1",
  payload: JSON.stringify({ event_id: eventId, data: { id: chargeId, status, status_details: { changed_at: changedAt } } }),
  charge: { chargeId, status, changedAt },
});

test("a repeated event is stored once and changes nothing", () => {
  const store = openStore(freshPath());
  assert.equal(store.recordEvent(event("evt-1", "ch-walk", "paid", "2026-10-05T04:13:41.366Z")), true);
  assert.equal(store.recordEvent(event("evt-1", "ch-walk", "failed", "2026-10-05T05:00:00Z")), false);
  assert.equal(store.getChargeStatus("ch-walk")?.status, "paid");
});

test("an older event never replaces a newer status", () => {
  const store = openStore(freshPath());
  store.recordEvent(event("evt-paid", "ch-walk", "paid", "2026-10-05T04:13:41.3663282Z"));
  store.recordEvent(event("evt-pending", "ch-walk", "pending", "2026-10-05T04:13:41.366Z"));
  assert.equal(store.getChargeStatus("ch-walk")?.status, "paid");
  store.recordEvent(event("evt-reversed", "ch-walk", "reversed", "2026-10-07T09:00:00Z"));
  assert.equal(store.getChargeStatus("ch-walk")?.status, "reversed");
});

test("different statuses at the same changed_at are unresolved in either arrival order", () => {
  for (const [first, second] of [["paid", "reversed"], ["reversed", "paid"]]) {
    const store = openStore(freshPath());
    store.recordEvent(event(`evt-${first}`, "ch-walk", first, "2026-10-05T04:13:41.3663282Z"));
    store.recordEvent(event(`evt-${second}`, "ch-walk", second, "2026-10-05T04:13:41.3663282Z"));
    assert.equal(store.getChargeStatus("ch-walk")?.status, "unresolved");
    store.recordEvent(event("evt-same-again", "ch-walk", first, "2026-10-05T04:13:41.3663282Z"));
    assert.equal(store.getChargeStatus("ch-walk")?.status, "unresolved");
  }
});

test("the same status again under a new event id changes nothing", () => {
  const store = openStore(freshPath());
  store.recordEvent(event("evt-1", "ch-walk", "paid", "2026-10-05T04:13:41Z"));
  assert.equal(store.recordEvent(event("evt-2", "ch-walk", "paid", "2026-10-05T04:13:41Z")), true);
  assert.equal(store.getChargeStatus("ch-walk")?.status, "paid");
});

test("walk and tip charges of one order keep separate statuses", () => {
  const store = openStore(freshPath());
  store.saveOrder({ id: "o1", ownerId: "u1", amountCents: 2500, currency: "USD", paykey: "pk", chargeId: "ch-walk", tipChargeId: "ch-tip" });
  store.recordEvent(event("evt-walk", "ch-walk", "reversed", "2026-10-05T04:00:00Z"));
  store.recordEvent(event("evt-tip", "ch-tip", "paid", "2026-10-05T05:00:00Z"));
  assert.equal(store.getChargeStatus("ch-walk")?.status, "reversed");
  assert.equal(store.getChargeStatus("ch-tip")?.status, "paid");
});

test("an event for an unknown charge creates no order", () => {
  const store = openStore(freshPath());
  store.recordEvent(event("evt-x", "ch-unknown", "paid", "2026-10-05T04:00:00Z"));
  assert.equal(store.getOrder("ch-unknown"), undefined);
  assert.equal(store.getChargeStatus("ch-unknown")?.status, "paid");
});

test("a status write that fails stores nothing, so the redelivery is processed", () => {
  const path = freshPath();
  const store = openStore(path);
  // A second connection makes the status write fail after the event row is inserted in the same transaction.
  const other = new DatabaseSync(path);
  other.exec("CREATE TRIGGER fail_status BEFORE INSERT ON charge_status BEGIN SELECT RAISE(ABORT, 'disk full'); END");
  assert.throws(() => store.recordEvent(event("evt-1", "ch-walk", "paid", "2026-10-05T04:00:00Z")), /disk full/);
  other.exec("DROP TRIGGER fail_status");
  other.close();
  assert.equal(store.getChargeStatus("ch-walk"), undefined);
  assert.equal(store.recordEvent(event("evt-1", "ch-walk", "paid", "2026-10-05T04:00:00Z")), true);
  assert.equal(store.getChargeStatus("ch-walk")?.status, "paid");
});

test("events and statuses survive reopening the database file", () => {
  const path = freshPath();
  const first = openStore(path);
  first.recordEvent(event("evt-1", "ch-walk", "paid", "2026-10-05T04:00:00Z"));
  first.close();
  const reopened = openStore(path);
  assert.equal(reopened.getChargeStatus("ch-walk")?.status, "paid");
  assert.equal(reopened.recordEvent(event("evt-1", "ch-walk", "paid", "2026-10-05T04:00:00Z")), false);
});
