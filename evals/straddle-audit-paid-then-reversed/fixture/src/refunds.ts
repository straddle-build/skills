import { straddle } from './straddle';
import { db } from './db';
import { idempotencyKey } from './keys';

// One refund per paid charge, with its own idempotency key.
export async function refundOrder(orderId: string) {
  const order = await db.orders.get(orderId);
  if (order.refundId) return order.refundId;
  if (order.chargeStatus !== 'paid') throw new Error(`order ${orderId} isn't paid; only a paid charge is refunded`);
  const refund = await straddle.charges.refund(order.chargeId, {
    external_id: `refund-${orderId}`,
    'Idempotency-Key': idempotencyKey('rfd', `refund-${orderId}`),
  });
  await db.orders.recordRefund(orderId, refund.data.id);
  return refund.data.id;
}

// Resubmit once, and only an insufficient_funds return (R01 or R09).
export async function resubmitOrder(orderId: string) {
  const order = await db.orders.get(orderId);
  if (order.resubmitChargeId) return order.resubmitChargeId;
  if (!['failed', 'reversed'].includes(order.chargeStatus) || order.returnReason !== 'insufficient_funds') {
    throw new Error(`order ${orderId} can't be resubmitted: ${order.chargeStatus}, ${order.returnReason}`);
  }
  const resubmit = await straddle.charges.resubmit(order.chargeId, {
    external_id: `order-${orderId}-r1`,
    'Idempotency-Key': idempotencyKey('rsb', `order-${orderId}-r1`),
  });
  await db.orders.recordResubmit(orderId, resubmit.data.id);
  return resubmit.data.id;
}
