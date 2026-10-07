import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { openStore, paymentState } from "../src/db.ts";

const freshPath = () => join(mkdtempSync(join(tmpdir(), "walkies-db-")), "walkies.sqlite");
const event = (eventId: string, chargeId: string, status: string, changedAt: string, details: { reason?: string; code?: string; source?: string } = {}) => ({
  eventId,
  eventType: "charge.event.v1",
  payload: JSON.stringify({ event_id: eventId, data: { id: chargeId, status, status_details: { changed_at: changedAt, ...details } } }),
  charge: { chargeId, status, changedAt, ...details },
});

test("a paid walk charge later reversed stops being payable, while the tip stays paid", () => {
  const store = openStore(freshPath());
  store.recordEvent(event("evt-walk-paid", "ch-walk", "paid", "2026-10-05T04:00:00Z", { reason: "ok", source: "system" }));
  store.recordEvent(event("evt-tip-paid", "ch-tip", "paid", "2026-10-05T04:30:00Z", { reason: "ok", source: "system" }));
  assert.deepEqual(paymentState(store.getChargeStatus("ch-walk")), { state: "paid", payable: true, reason: "ok", code: null, source: "system", supportAction: null });
  store.recordEvent(event("evt-walk-reversed", "ch-walk", "reversed", "2026-10-07T09:00:00Z", { reason: "insufficient_funds", code: "R01", source: "bank_decline" }));
  // A late pending and a redelivered paid change nothing.
  store.recordEvent(event("evt-walk-pending", "ch-walk", "pending", "2026-10-04T12:00:00Z", { reason: "ok", source: "system" }));
  store.recordEvent(event("evt-walk-paid", "ch-walk", "paid", "2026-10-05T04:00:00Z", { reason: "ok", source: "system" }));
  const walk = paymentState(store.getChargeStatus("ch-walk"));
  assert.equal(walk.state, "reversed");
  assert.equal(walk.payable, false);
  assert.equal(walk.code, "R01");
  assert.equal(walk.supportAction, "Contact the owner; support may resubmit once within Nacha's reinitiation limits.");
  assert.equal(paymentState(store.getChargeStatus("ch-tip")).state, "paid");
});

test("only a user_action hold is ours, a watchtower hold is under review, any other hold needs review", () => {
  const store = openStore(freshPath());
  store.recordEvent(event("evt-1", "ch-own", "on_hold", "2026-10-05T04:00:00Z", { reason: "user_request", source: "user_action" }));
  store.recordEvent(event("evt-2", "ch-risk", "on_hold", "2026-10-05T04:00:00Z", { reason: "risk_review", source: "watchtower" }));
  store.recordEvent(event("evt-3", "ch-odd", "on_hold", "2026-10-05T04:00:00Z", { reason: "other" }));
  assert.equal(paymentState(store.getChargeStatus("ch-own")).state, "on_hold");
  assert.equal(paymentState(store.getChargeStatus("ch-risk")).state, "under_review");
  assert.deepEqual([paymentState(store.getChargeStatus("ch-odd")).state, paymentState(store.getChargeStatus("ch-odd")).payable], ["needs_review", false]);
});

test("failed and cancelled charges are not payable and name a support action by reason", () => {
  const store = openStore(freshPath());
  store.recordEvent(event("evt-1", "ch-closed", "failed", "2026-10-05T04:00:00Z", { reason: "closed_bank_account", code: "R02", source: "bank_decline" }));
  store.recordEvent(event("evt-2", "ch-cancel", "cancelled", "2026-10-05T04:00:00Z", { reason: "user_request", source: "user_action" }));
  const failed = paymentState(store.getChargeStatus("ch-closed"));
  assert.deepEqual([failed.state, failed.payable, failed.supportAction], ["failed", false, "Ask the owner to link another bank account; don't retry this one."]);
  const cancelled = paymentState(store.getChargeStatus("ch-cancel"));
  assert.deepEqual([cancelled.state, cancelled.payable, cancelled.supportAction], ["cancelled", false, "Contact support; no new charge is made automatically."]);
});

test("an unknown status is processing and never paid; no charge yet is payable", () => {
  const store = openStore(freshPath());
  store.recordEvent(event("evt-1", "ch-walk", "unsettled", "2026-10-05T04:00:00Z"));
  assert.deepEqual([paymentState(store.getChargeStatus("ch-walk")).state, paymentState(undefined).state], ["processing", "none"]);
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
