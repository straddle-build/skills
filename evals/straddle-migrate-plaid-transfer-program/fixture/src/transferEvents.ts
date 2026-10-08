import express from 'express';
import { plaid } from './plaid';
import { db } from './db';
import { invoiceState } from './billing';

// TRANSFER_EVENTS_UPDATE carries no transfer ID, so the handler syncs events from the stored cursor.
export const transferWebhooks = express.Router();
transferWebhooks.post('/plaid/webhooks', express.json(), async (req, res) => {
  if (req.body.webhook_code !== 'TRANSFER_EVENTS_UPDATE') return res.sendStatus(200);
  let afterId = await db.cursors.get('plaid-transfer');
  for (;;) {
    const page = await plaid.transferEventSync({ after_id: afterId, count: 25 });
    for (const event of page.data.transfer_events) {
      await db.invoices.setState(event.transfer_id, invoiceState(event.event_type), event.failure_reason?.ach_return_code);
      afterId = event.event_id;
    }
    await db.cursors.set('plaid-transfer', afterId);
    if (page.data.transfer_events.length < 25) break;
  }
  res.sendStatus(200);
});
