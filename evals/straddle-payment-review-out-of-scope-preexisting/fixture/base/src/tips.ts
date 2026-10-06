import express, { type Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.ts";
import { getOrder } from "./db.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

const TIP_CENTS = 500;

router.post("/orders/:id/tip", express.json(), requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const order = await getOrder(req.params.id);
  if (!order || order.ownerId !== user.id) return res.status(404).json({ error: "order not found" });
  const charge = await straddle.charges.create(
    {
      paykey: order.paykey,
      amount: TIP_CENTS,
      currency: order.currency,
      description: `Tip for walk ${order.id}`,
      external_id: `tip-${order.id}`,
      payment_date: new Date().toISOString().slice(0, 10),
      consent_type: "internet",
      device: { ip_address: req.ip ?? "0.0.0.0" },
      config: { balance_check: "enabled" },
    },
    { headers: { "Idempotency-Key": `tip-order-${order.id}` } },
  );
  res.json({ chargeId: charge.data.id });
});
