import express from "express";
import { saveEvent } from "./db.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

router.post("/webhooks/straddle", express.text({ type: "*/*" }), async (req, res) => {
  const event = JSON.parse(req.body);
  if (await saveEvent(event.event_id, event)) console.info("stored", event.event_type);
  const secret = process.env.STRADDLE_WEBHOOK_SECRET;
  if (secret) straddle.webhooks.unwrap(req.body, { headers: req.headers, key: secret });
  res.sendStatus(200);
});
