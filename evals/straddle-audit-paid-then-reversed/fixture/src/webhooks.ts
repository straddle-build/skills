import express from 'express';
import { straddle } from './straddle';
import { db } from './db';
import { handleEvent } from './lifecycle';

export const webhooks = express.Router();

// Verify the raw body with the request's webhook-* headers, store the event once, then acknowledge.
webhooks.post('/straddle/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.STRADDLE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send('Straddle configuration error: STRADDLE_WEBHOOK_SECRET is not set');
  const raw = req.body as Buffer;
  const text = raw.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(raw)) return res.sendStatus(400);
  let event;
  try {
    event = straddle.webhooks.unwrap(text, { headers: req.headers as Record<string, string>, key: secret });
  } catch {
    return res.sendStatus(400);
  }
  const webhookId = req.header('webhook-id');
  if (!webhookId) return res.sendStatus(400);
  if (await db.events.has(webhookId)) return res.sendStatus(200);
  try {
    await db.events.save(webhookId, event);
    await handleEvent(event);
  } catch {
    return res.sendStatus(500);
  }
  res.sendStatus(200);
});
