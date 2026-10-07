import express, { type Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.ts";
import { getOrder, saveOrder } from "./db.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

router.post("/orders/:id/bank", express.json(), requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const order = await getOrder(req.params.id);
  if (!order || order.ownerId !== user.id) return res.status(404).json({ error: "order not found" });
  const paykey = await straddle.paykeys.get(String(req.body.paykeyId));
  if (paykey.data.status !== "active") return res.status(409).json({ error: "bank account not ready" });
  await saveOrder({ ...order, paykey: paykey.data.paykey });
  res.json({ label: paykey.data.label });
});
