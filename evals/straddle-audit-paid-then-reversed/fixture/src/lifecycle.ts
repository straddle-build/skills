import { db } from './db';
import { reconcileFundingEvent } from './reconcile';

// Status changes from the webhook endpoint. Each resource keeps the newest status by status_details.changed_at.
export async function handleEvent(event: any) {
  switch (event.event_type) {
    case 'paykey.event.v1':
      return onPaykey(event.data);
    case 'charge.event.v1':
      return onCharge(event.data);
    case 'funding_event.event.v1':
      return reconcileFundingEvent(event.data);
  }
}

async function onPaykey(paykey: any) {
  if (!(await db.paykeys.isNewer(paykey.id, paykey.status_details?.changed_at ?? paykey.updated_at))) return;
  await db.paykeys.setStatus(paykey.id, paykey.status, paykey.status_details);
}

async function onCharge(charge: any) {
  const changedAt = charge.status_details?.changed_at ?? charge.updated_at;
  if (!(await db.orders.isNewer(charge.id, changedAt))) return;
  const order = await db.orders.byChargeId(charge.id);
  switch (charge.status) {
    case 'created':
    case 'scheduled':
    case 'validating':
    case 'pending':
      await db.orders.setState(order.id, 'processing');
      break;
    case 'on_hold':
      await db.orders.setState(order.id, 'under review');
      break;
    case 'paid':
      await db.orders.setState(order.id, 'paid');
      await db.shipments.release(order.id);
      break;
    case 'failed':
      await db.orders.setState(order.id, 'payment failed', charge.status_details);
      await db.customers.notifyPaymentFailed(order.id, charge.status_details?.reason);
      break;
    case 'cancelled':
      await db.orders.setState(order.id, 'cancelled');
      break;
    case 'reversed':
      // A return after paid (R01, R02, or a dispute weeks later): undo what paid released.
      await db.orders.setState(order.id, 'returned after paid', charge.status_details);
      await db.shipments.holdFutureBoxes(order.id);
      await db.ledger.recordClawback(order.id, charge.amount, charge.status_details?.code);
      break;
    default:
      // A status this code doesn't know is never treated as settled.
      console.warn('unhandled charge status', charge.id, charge.status);
  }
  await db.orders.recordStatus(order.id, charge.status, changedAt, charge.funding_ids ?? []);
}
