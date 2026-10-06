import { createHash } from "node:crypto";
import { APIError } from "@straddlecom/straddle";
import express, { type NextFunction, type Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.ts";
import { getOrder, saveOrder } from "./db.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

// payment_date is a calendar date in US Eastern time; an earlier date is rejected.
const easternDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });

async function charge(order: { id: string; paykey: string; currency: "USD" }, amount: number, externalId: string, ip: string) {
  const correlationId = `charge-${externalId}`;
  // The key must be 10 to 40 characters, so it is a fixed-length hash of the stable external ID, never the raw ID.
  const idempotencyKey = `chg-${createHash("sha256").update(externalId).digest("hex").slice(0, 32)}`;
  try {
    // The SDK retries timeouts with the same Idempotency-Key, so a dropped response never creates a second charge.
    const result = await straddle.charges.create(
      {
        paykey: order.paykey,
        amount,
        currency: order.currency,
        description: `Walk ${order.id}`,
        external_id: externalId,
        payment_date: easternDate.format(new Date()),
        consent_type: "internet",
        device: { ip_address: ip },
        config: { balance_check: "enabled" },
        "Correlation-Id": correlationId,
        "Idempotency-Key": idempotencyKey,
      },
    );
    console.info("straddle charge created", { order: order.id, correlationId, requestId: result.meta?.api_request_id });
    return result.data.id;
  } catch (err) {
    const status = err instanceof APIError ? err.status : undefined;
    console.error("straddle charge failed", { order: order.id, correlationId, status });
    throw err;
  }
}

router.post("/orders/:id/checkout", express.json(), requireUser, async (req, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthedRequest;
    const order = await getOrder(req.params.id);
    if (!order || order.ownerId !== user.id) return res.status(404).json({ error: "order not found" });
    if (order.chargeId) return res.json({ chargeId: order.chargeId });
    const chargeId = await charge(order, order.amountCents, `order-${order.id}`, req.ip ?? "0.0.0.0");
    await saveOrder({ ...order, chargeId });
    res.json({ chargeId });
  } catch (err) {
    next(err);
  }
});

router.post("/orders/:id/tip", express.json(), requireUser, async (req, res: Response, next: NextFunction) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order || order.tipChargeId) return res.status(404).json({ error: "order not found" });
    const tipChargeId = await charge(order, Number(req.body.tipCents), `tip-${order.id}`, req.ip ?? "0.0.0.0");
    await saveOrder({ ...order, tipChargeId });
    res.json({ chargeId: tipChargeId });
  } catch (err) {
    next(err);
  }
});
