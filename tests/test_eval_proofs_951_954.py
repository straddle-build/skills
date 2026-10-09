"""The ME-951 and ME-954 cases' regex graders pass a good generated artifact and fail a seeded bad one, applied the way
`claude plugin eval` applies a regex grader: its pattern with its flags on the target file, an absent file read as
empty text, and `match: not_contains` inverting the result. Each case's scaffold runs first with `npm` stubbed out,
so these tests need no network."""
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

EVALS = Path(__file__).resolve().parents[1] / "evals"
FLAGS = {"m": re.M, "i": re.I, "s": re.S}
CHAIN = "straddle-integrate-object-chain-activity"
DASHBOARD = "straddle-integrate-orders-dashboard-projection"


def frontmatter(grader):
    """The grader's frontmatter fields, with YAML single-quoted values unescaped."""
    fields = {}
    for line in (EVALS / grader).read_text().split("---", 2)[1].splitlines():
        key, colon, value = line.partition(":")
        if colon and key.strip():
            value = value.strip()
            if len(value) > 1 and value[0] == value[-1] == "'":
                value = value[1:-1].replace("''", "'")
            fields[key.strip()] = value
    return fields


def grade(grader, work):
    g = frontmatter(grader)
    assert g["type"] == "regex", grader
    file = work / re.search(r"path:\s*([^\s}]+)", g["target"]).group(1)
    text = file.read_text() if file.is_file() else ""
    flags = 0
    for flag in g.get("flags", ""):
        flags |= FLAGS[flag]
    found = re.search(g["pattern"], text, flags) is not None
    return found if g.get("match", "contains") == "contains" else not found


class Workspace:
    """A case's scaffold run in a temporary directory with npm stubbed out."""

    def __init__(self, case):
        self.case = case

    def __enter__(self):
        self.root = Path(tempfile.mkdtemp())
        stub = self.root / ".stub-bin"
        stub.mkdir()
        (stub / "npm").write_text("#!/bin/sh\nexit 0\n")
        (stub / "npm").chmod(0o755)
        env = {**os.environ, "PATH": f"{stub}{os.pathsep}{os.environ['PATH']}"}
        work = self.root / "work"
        work.mkdir()
        subprocess.run(["bash", str(EVALS / self.case / "scaffold.sh")], cwd=work, env=env, check=True,
                       capture_output=True, text=True)
        return work

    def __exit__(self, *exc):
        shutil.rmtree(self.root, ignore_errors=True)


def put(work, path, text):
    (work / path).parent.mkdir(parents=True, exist_ok=True)
    (work / path).write_text(text)


PAYMENTS = """import { randomUUID } from "node:crypto";

function logRequest(db, operation, res) {
  db.straddle_requests.push({ at: new Date().toISOString(), operation, resource_id: res.data.id,
    status: res.data.status, http_status: 200 });
}

export async function createCustomer(client, db, user) {
  const res = await client.customers.create({
    name: user.name, type: "individual", email: user.email, phone: user.phone, device: { ip_address: user.ip },
    external_id: `nw-user-${user.id}`,
    metadata: { app_user_id: user.id },
  }, { headers: { "Idempotency-Key": randomUUID() } });
  user.straddle_customer_id = res.data.id;
  logRequest(db, "createCustomer", res);
  return res.data;
}

export async function createBridgeToken(client, user) {
  return client.bridge.initialize({ customer_id: user.straddle_customer_id, external_id: `nw-pk-${user.id}` });
}

export async function createBankAccountPaykey(client, db, user, bank) {
  const res = await client.bridge.link.bankAccount({
    customer_id: user.straddle_customer_id, account_holder: bank.holder, account_number: bank.number,
    routing_number: bank.routing, account_type: "checking",
    external_id: `nw-pk-${user.id}`,
    metadata: { app_user_id: user.id },
  });
  bank.straddle_paykey_id = res.data.id;
  logRequest(db, "createBankAccountPaykey", res);
  return res.data;
}

export async function chargeOrder(client, db, order) {
  const user = db.users.get(order.user_id);
  const res = await client.charges.create({
    paykey: order.paykey_token, amount: order.amount_cents, currency: "USD", payment_date: order.date,
    consent_type: "internet", device: { ip_address: user.ip }, description: `Order ${order.id}`,
    external_id: `nw-order-${order.id}`,
    metadata: { order_id: order.id, app_user_id: user.id },
  });
  order.straddle_charge_id = res.data.id;
  logRequest(db, "createCharge", res);
  return res.data;
}
"""

ACTIVITY = """export function orderActivity(db, orderId) {
  const order = db.orders.get(orderId);
  const user = db.users.get(order.user_id);
  const bank = db.bank_accounts.get(order.bank_account_id);
  const ids = new Set([user.straddle_customer_id, bank.straddle_paykey_id, order.straddle_charge_id].filter(Boolean));
  const requests = db.straddle_requests.filter((r) => ids.has(r.resource_id)).map((r) => ({ kind: "request", ...r }));
  const events = db.straddle_events.filter((e) => ids.has(e.data.id)).map((e) => ({ kind: "event", ...e }));
  return [...requests, ...events].sort((a, b) => a.at.localeCompare(b.at));
}
"""

ACTIVITY_BY_ORDER_ID = """export function orderActivity(db, orderId) {
  const events = db.straddle_events.filter((e) => e.data.metadata?.order_id === orderId);
  const requests = db.straddle_requests.filter((r) => r.order_id === orderId);
  return [...requests, ...events].sort((a, b) => a.at.localeCompare(b.at));
}
"""

ACTIVITY_BY_EXTERNAL_ID = """export function orderActivity(db, orderId) {
  const order = db.orders.get(orderId);
  const user = db.users.get(order.user_id);
  const bank = db.bank_accounts.get(order.bank_account_id);
  const ids = new Set([user.straddle_customer_id, bank.straddle_paykey_id, order.straddle_charge_id]);
  return db.straddle_events.filter((e) => ids.has(e.data.id) || e.data.external_id === `nw-order-${orderId}`);
}
"""


class ObjectChainGraders(unittest.TestCase):
    """ME-951: approved identifier values on every create, and an activity view joined along the object chain."""

    def grader(self, name):
        return f"{CHAIN}/graders/{name}.md"

    def test_good_artifacts_pass(self):
        with Workspace(CHAIN) as work:
            put(work, "src/straddle/payments.mjs", PAYMENTS)
            put(work, "src/admin/order-activity.mjs", ACTIVITY)
            for name in ("customer-external-id", "paykey-external-id", "charge-external-id", "metadata-order-id",
                         "metadata-app-user-id", "metadata-count", "activity-joins-chain", "activity-not-by-order-id"):
                self.assertTrue(grade(self.grader(name), work), name)

    def test_missing_identifier_values_fail(self):
        seeds = {
            "customer-external-id": ("`nw-user-${user.id}`", "user.id"),
            "paykey-external-id": ("`nw-pk-${user.id}`", "user.id"),
            "charge-external-id": ("`nw-order-${order.id}`", "String(order.id)"),
            "metadata-order-id": ("{ order_id: order.id, app_user_id: user.id }", "{ app_user_id: user.id }"),
            "metadata-app-user-id": ("app_user_id: user.id", "user_id: user.id"),
        }
        for name, (old, new) in seeds.items():
            with self.subTest(name), Workspace(CHAIN) as work:
                assert old in PAYMENTS, old
                put(work, "src/straddle/payments.mjs", PAYMENTS.replace(old, new))
                self.assertFalse(grade(self.grader(name), work), f"{name} passed without its value")

    def test_metadata_only_on_the_charge_fails(self):
        with Workspace(CHAIN) as work:
            seeded = PAYMENTS.replace("    metadata: { app_user_id: user.id },\n", "")
            self.assertEqual(seeded.count("metadata"), 1)
            put(work, "src/straddle/payments.mjs", seeded)
            self.assertFalse(grade(self.grader("metadata-count"), work))

    def test_activity_by_order_id_fails(self):
        with Workspace(CHAIN) as work:
            put(work, "src/admin/order-activity.mjs", ACTIVITY_BY_ORDER_ID)
            self.assertFalse(grade(self.grader("activity-joins-chain"), work))
            self.assertFalse(grade(self.grader("activity-not-by-order-id"), work))
            put(work, "src/admin/order-activity.mjs", ACTIVITY_BY_EXTERNAL_ID)
            self.assertTrue(grade(self.grader("activity-joins-chain"), work))
            self.assertFalse(grade(self.grader("activity-not-by-order-id"), work))

    def test_missing_files_fail(self):
        with Workspace(CHAIN) as work:
            for name in ("customer-external-id", "paykey-external-id", "charge-external-id", "metadata-order-id",
                         "metadata-app-user-id", "metadata-count", "activity-joins-chain"):
                self.assertFalse(grade(self.grader(name), work), name)


DASHBOARD_GOOD = """export function ordersDashboard(db) {
  return db.listOrders().map((order) => ({
    order_id: order.id,
    amount_cents: order.amount_cents,
    customer_status: db.getCustomerProjection(order.straddle_customer_id)?.status ?? "unknown",
    charge_status: db.getChargeProjection(order.straddle_charge_id)?.status ?? "unknown",
  }));
}
"""

# The Northwind loop ME-954 reports: one Straddle read per order on every 3-second poll.
DASHBOARD_PER_ROW = """import { createStraddleClient } from "../straddle/client.mjs";

const client = createStraddleClient();

export async function ordersDashboard(db) {
  return Promise.all(db.listOrders().map(async (order) => {
    const review = await client.customers.review.get(order.straddle_customer_id);
    const charge = await client.charges.get(order.straddle_charge_id);
    return { order_id: order.id, customer_status: review.data.customer_details.status, charge_status: charge.data.status };
  }));
}
"""

REVIEW_CACHE = """export function createReviewCache(client, { ttlMs = 5 * 60 * 1000 } = {}) {
  const entries = new Map();
  return {
    async get(customerId) {
      const hit = entries.get(customerId);
      if (hit && Date.now() - hit.at < ttlMs) return hit.value;
      const res = await client.customers.review.get(customerId);
      entries.set(customerId, { value: res.data, at: Date.now() });
      return res.data;
    },
    clear(customerId) { entries.delete(customerId); },
  };
}
"""

WEBHOOK = """export function createWebhookHandler({ client, db, cache, secret }) {
  const seen = new Set();
  return async (rawBody, headers) => {
    const event = client.webhooks.unwrap(rawBody, { headers, key: secret });
    if (seen.has(event.event_id)) return 200;
    seen.add(event.event_id);
    if (event.event_type === "customer.event.v1") {
      db.putCustomerProjection({ id: event.data.id, status: event.data.status, updated_at: event.data.updated_at });
      cache.clear(event.data.id);
    } else if (event.event_type === "charge.event.v1") {
      db.putChargeProjection({ id: event.data.id, status: event.data.status, updated_at: event.data.updated_at });
    }
    return 200;
  };
}
"""

DECISION = """export async function decideCustomerReview(client, cache, customerId, decision) {
  const res = await client.customers.review.decision(customerId, { status: decision });
  cache.clear(customerId);
  return res.data;
}
"""


class OrdersDashboardGraders(unittest.TestCase):
    """ME-954: the dashboard renders from the local projection; the review cache expires and is cleared."""

    def grader(self, name):
        return f"{DASHBOARD}/graders/{name}.md"

    def write_good(self, work):
        put(work, "src/admin/orders-dashboard.mjs", DASHBOARD_GOOD)
        put(work, "src/straddle/review-cache.mjs", REVIEW_CACHE)
        put(work, "src/webhooks/straddle.mjs", WEBHOOK)
        put(work, "src/admin/review-decision.mjs", DECISION)

    def test_good_artifacts_pass(self):
        with Workspace(DASHBOARD) as work:
            self.write_good(work)
            for name in ("dashboard-reads-projection", "dashboard-no-straddle-read", "cache-expires",
                         "webhook-clears-cache", "decision-clears-cache"):
                self.assertTrue(grade(self.grader(name), work), name)

    def test_per_row_reads_fail(self):
        with Workspace(DASHBOARD) as work:
            self.write_good(work)
            put(work, "src/admin/orders-dashboard.mjs", DASHBOARD_PER_ROW)
            self.assertFalse(grade(self.grader("dashboard-no-straddle-read"), work))
            self.assertFalse(grade(self.grader("dashboard-reads-projection"), work))
            for seeded in (
                'import Straddle from "@straddlecom/straddle";\n' + DASHBOARD_GOOD,
                DASHBOARD_GOOD.replace("db.getChargeProjection(order.straddle_charge_id)?.status",
                                       "(await client.charges.get(order.straddle_charge_id)).data.status"),
                DASHBOARD_GOOD.replace("db.getChargeProjection(order.straddle_charge_id)?.status",
                                       "(await (await fetch(`/v1/charges/${order.straddle_charge_id}`)).json()).status"),
            ):
                put(work, "src/admin/orders-dashboard.mjs", seeded)
                self.assertFalse(grade(self.grader("dashboard-no-straddle-read"), work), seeded)

    def test_cache_without_expiry_or_clearing_fails(self):
        with Workspace(DASHBOARD) as work:
            self.write_good(work)
            put(work, "src/straddle/review-cache.mjs", """export function createReviewCache(client, { ttlMs } = {}) {
  const entries = new Map();
  return {
    async get(customerId) {
      if (!entries.has(customerId)) entries.set(customerId, (await client.customers.review.get(customerId)).data);
      return entries.get(customerId);
    },
    clear(customerId) { entries.delete(customerId); },
  };
}
""")
            self.assertFalse(grade(self.grader("cache-expires"), work))
            put(work, "src/webhooks/straddle.mjs", WEBHOOK.replace("      cache.clear(event.data.id);\n", ""))
            self.assertFalse(grade(self.grader("webhook-clears-cache"), work))
            put(work, "src/admin/review-decision.mjs", DECISION.replace("  cache.clear(customerId);\n", ""))
            self.assertFalse(grade(self.grader("decision-clears-cache"), work))

    def test_missing_files_fail(self):
        with Workspace(DASHBOARD) as work:
            for name in ("dashboard-reads-projection", "cache-expires", "webhook-clears-cache", "decision-clears-cache"):
                self.assertFalse(grade(self.grader(name), work), name)


if __name__ == "__main__":
    unittest.main()
