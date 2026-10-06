import express from "express";
import { saveEvent } from "./db.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

router.post("/webhooks/straddle", express.text({ type: "*/*" }), async (req, res) => {
  const secret = process.env.STRADDLE_WEBHOOK_SECRET;
  if (!secret) return res.sendStatus(500);
  let event;
  try {
    event = straddle.webhooks.unwrap(req.body, { headers: req.headers, key: secret });
  } catch {
    console.warn("webhook rejected at signature check");
    return res.sendStatus(400);
  }
  await saveEvent(event.event_id, event);
  res.sendStatus(200);
});
