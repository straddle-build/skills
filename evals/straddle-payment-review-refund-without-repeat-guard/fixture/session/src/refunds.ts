import express, { type Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.ts";
import { getOrder } from "./db.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

router.post("/orders/:id/refund", express.json(), requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const order = await getOrder(req.params.id);
  if (!order || order.ownerId !== user.id || !order.chargeId) return res.status(404).json({ error: "order not found" });
  const payout = await straddle.payouts.create(
    {
      paykey: order.paykey,
      amount: order.amountCents,
      currency: order.currency,
      description: `Refund walk ${order.id}`,
      external_id: `refund-${order.id}-${Date.now()}`,
      payment_date: new Date().toISOString().slice(0, 10),
      device: { ip_address: req.ip ?? "0.0.0.0" },
    },
    { headers: { "Idempotency-Key": `refund-${order.id}-${Date.now()}` } },
  );
  res.json({ payoutId: payout.data.id });
});
