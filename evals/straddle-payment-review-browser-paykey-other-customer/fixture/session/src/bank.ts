import type { Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.js";
import { getOrder, saveOrder } from "./db.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

router.post("/orders/:id/bank", requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const order = await getOrder(req.params.id);
  if (!order || order.ownerId !== user.id) return res.status(404).json({ error: "order not found" });
  const paykey = await straddle.paykeys.get(String(req.body.paykeyId));
  if (paykey.data.status !== "active") return res.status(409).json({ error: "bank account not ready" });
  await saveOrder({ ...order, paykey: paykey.data.paykey });
  res.json({ label: paykey.data.label });
});
