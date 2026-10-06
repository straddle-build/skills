import express from "express";
import { recordEvent } from "./db.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

const secret = process.env.STRADDLE_WEBHOOK_SECRET;
if (!secret) throw new Error("STRADDLE_WEBHOOK_SECRET is not set");

// The charge statuses a charge.event.v1 delivers. Anything else is stored as `unsettled`, never as settled.
const KNOWN: Record<string, true> = {
  created: true, scheduled: true, on_hold: true, pending: true, paid: true, failed: true, reversed: true, cancelled: true,
};

router.post("/webhooks/straddle", express.raw({ type: "*/*" }), async (req, res) => {
  let event;
  try {
    event = straddle.webhooks.unwrap(req.body, { headers: req.headers as Record<string, string>, key: secret });
  } catch {
    console.warn("straddle webhook rejected", { stage: "signature", headers: Object.keys(req.headers).filter((h) => h.startsWith("webhook-")) });
    return res.sendStatus(400);
  }
  const charge = event.event_type === "charge.event.v1" ? event.data : undefined;
  try {
    // The event and the status it carries are committed together before the 2xx; a failed write answers 500 so
    // Straddle retries, and a redelivery of a stored event is a no-op.
    const stored = await recordEvent({
      eventId: event.event_id,
      eventType: event.event_type,
      payload: req.body.toString("utf8"),
      charge: charge && {
        chargeId: charge.id,
        status: Object.hasOwn(KNOWN, charge.status) ? charge.status : "unsettled",
        // Ordered by when the status changed, not by arrival; events without changed_at use updated_at.
        changedAt: charge.status_details?.changed_at ?? charge.updated_at,
        reason: charge.status_details?.reason,
        code: charge.status_details?.code,
      },
    });
    if (stored && charge) {
      console.info("straddle charge status", { charge: charge.id, status: charge.status, returnCode: charge.status_details?.code, requestId: event.data.request_id });
    }
  } catch (err) {
    console.error("straddle webhook not stored", { event: event.event_id, error: err instanceof Error ? err.name : "unknown" });
    return res.sendStatus(500);
  }
  res.sendStatus(200);
});
