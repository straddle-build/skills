import express, { type Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.ts";
import { getOrder, saveOrder } from "./db.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

router.post("/orders/:id/checkout", express.json(), requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const order = await getOrder(req.params.id);
  if (!order || order.ownerId !== user.id) return res.status(404).json({ error: "order not found" });
  if (order.chargeId) return res.json({ chargeId: order.chargeId });
  const charge = await straddle.charges.create(
    {
      paykey: order.paykey,
      amount: req.body.amount,
      currency: order.currency,
      description: `Walk ${order.id}`,
      external_id: `order-${order.id}`,
      payment_date: new Date().toISOString().slice(0, 10),
      consent_type: "internet",
      device: { ip_address: req.ip ?? "0.0.0.0" },
      config: { balance_check: "enabled" },
    },
    { headers: { "Idempotency-Key": `charge-order-${order.id}` } },
  );
  await saveOrder({ ...order, chargeId: charge.data.id });
  res.json({ chargeId: charge.data.id });
});
