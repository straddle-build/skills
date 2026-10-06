import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.js";
import { saveOrder } from "./db.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

const WALK_PRICE_CENTS = 2500;

router.post("/walks/book", requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const order = { id: randomUUID(), ownerId: user.id, amountCents: WALK_PRICE_CENTS, currency: "USD" as const, paykey: "" };
  await saveOrder(order);
  const customer = await straddle.customers.create(
    { type: "individual", name: String(req.body.name), email: String(req.body.email), phone: String(req.body.phone), device: { ip_address: req.ip ?? "0.0.0.0" }, external_id: `owner-${user.id}` },
    { headers: { "Idempotency-Key": `customer-${user.id}` } },
  );
  res.json({ orderId: order.id, customerId: customer.data.id });
});
