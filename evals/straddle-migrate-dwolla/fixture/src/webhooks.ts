import express from 'express';
import crypto from 'node:crypto';
import { dwolla } from './dwolla';
import { setPayoutState, setVisitState, visitStateFor } from './visits';

export const dwollaWebhooks = express.Router();

dwollaWebhooks.post('/webhooks/dwolla', express.raw({ type: 'application/json' }), async (req, res) => {
  const expected = crypto.createHmac('sha256', process.env.DWOLLA_WEBHOOK_SECRET!).update(req.body).digest('hex');
  if (expected !== req.header('X-Request-Signature-SHA-256')) return res.sendStatus(401);
  const event = JSON.parse(req.body.toString('utf8'));
  if (!/transfer_(completed|failed|cancelled)$/.test(event.topic)) return res.sendStatus(200);

  // Dwolla events carry only links, so fetch the transfer for its status.
  const transfer = await dwolla.get(event._links.resource.href);
  const { status, correlationId } = transfer.body;
  if (correlationId?.startsWith('visit-')) await setVisitState(correlationId.slice('visit-'.length), visitStateFor(status));
  if (correlationId?.startsWith('pay-')) await setPayoutState(correlationId, status);
  res.sendStatus(200);
});
