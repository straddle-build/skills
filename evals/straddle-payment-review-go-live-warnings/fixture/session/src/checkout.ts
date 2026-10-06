import type { Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.js";
import { getOrder, saveOrder } from "./db.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

async function charge(order: { id: string; paykey: string; currency: "USD" }, amount: number, externalId: string, ip: string) {
  // The SDK retries timeouts with the same Idempotency-Key, so a dropped response never creates a second charge.
  const result = await straddle.charges.create(
    {
      paykey: order.paykey,
      amount,
      currency: order.currency,
      description: `Walk ${order.id}`,
      external_id: externalId,
      payment_date: new Date().toISOString().slice(0, 10),
      consent_type: "internet",
      device: { ip_address: ip },
      config: { balance_check: "enabled" },
    },
    { headers: { "Idempotency-Key": externalId } },
  );
  console.info("straddle charge created", { order: order.id, requestId: result.meta?.api_request_id });
  return result.data.id;
}

router.post("/orders/:id/checkout", requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const order = await getOrder(req.params.id);
  if (!order || order.ownerId !== user.id) return res.status(404).json({ error: "order not found" });
  if (order.chargeId) return res.json({ chargeId: order.chargeId });
  const chargeId = await charge(order, order.amountCents, `order-${order.id}`, req.ip ?? "0.0.0.0");
  await saveOrder({ ...order, chargeId });
  res.json({ chargeId });
});

router.post("/orders/:id/tip", requireUser, async (req, res: Response) => {
  const order = await getOrder(req.params.id);
  if (!order || order.tipChargeId) return res.status(404).json({ error: "order not found" });
  const tipChargeId = await charge(order, Number(req.body.tipCents), `tip-${order.id}`, req.ip ?? "0.0.0.0");
  await saveOrder({ ...order, tipChargeId });
  res.json({ chargeId: tipChargeId });
});
