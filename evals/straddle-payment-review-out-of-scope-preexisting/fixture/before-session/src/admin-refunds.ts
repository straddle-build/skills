import express from "express";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

router.post("/admin/refund", express.json(), async (req, res) => {
  const payout = await straddle.payouts.create({ ...req.body, external_id: `admin-${Date.now()}` });
  res.json(payout);
});
