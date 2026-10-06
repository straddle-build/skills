import express from "express";
import { findOrderByCharge, saveEvent, saveOrder } from "./db.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

const secret = process.env.STRADDLE_WEBHOOK_SECRET;
if (!secret) throw new Error("STRADDLE_WEBHOOK_SECRET is not set");

const SETTLED = new Set(["paid", "failed", "reversed", "cancelled"]);
const KNOWN = new Set(["created", "scheduled", "on_hold", "pending", ...SETTLED]);

router.post("/webhooks/straddle", express.raw({ type: "*/*" }), async (req, res) => {
  let event;
  try {
    event = straddle.webhooks.unwrap(req.body, { headers: req.headers as Record<string, string>, key: secret });
  } catch {
    console.warn("straddle webhook rejected", { stage: "signature", headers: Object.keys(req.headers).filter((h) => h.startsWith("webhook-")) });
    return res.sendStatus(400);
  }
  if (!(await saveEvent(event.event_id))) return res.sendStatus(200);
  if (event.event_type === "charge.event.v1") {
    const order = await findOrderByCharge(event.data.id);
    // An unrecognized status (such as validating) is stored but never treated as settled.
    const status = KNOWN.has(event.data.status) ? event.data.status : "unsettled";
    if (order) await saveOrder({ ...order, chargeStatus: status });
    console.info("straddle charge status", { charge: event.data.id, status, returnCode: event.data.status_details?.code, requestId: event.data.request_id });
  }
  res.sendStatus(200);
});
