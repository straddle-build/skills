import express from "express";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

router.post("/payouts", express.json(), async (req, res) => {
  const payout = await straddle.payouts.create({
    paykey: req.body.paykey,
    amount: req.body.amount,
    currency: req.body.currency,
    description: "manual payout",
    external_id: `payout-${Date.now()}`,
    payment_date: new Date().toISOString().slice(0, 10),
    device: { ip_address: req.ip ?? "0.0.0.0" },
  });
  console.log("payout", req.body, payout);
  res.json(payout);
});
