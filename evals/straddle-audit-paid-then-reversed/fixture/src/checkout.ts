import { straddle } from './straddle';
import { db } from './db';
import { easternToday, idempotencyKey } from './keys';

export async function chargeOrder(orderId: string) {
  const order = await db.orders.get(orderId);
  const paykey = await db.paykeys.get(order.paykeyId);
  if (paykey?.status !== 'active') {
    throw new Error(`paykey ${order.paykeyId} is ${paykey?.status ?? 'unknown'}; only an active paykey is charged`);
  }
  const externalId = `order-${orderId}`;
  const charge = await straddle.charges.create({
    paykey: await db.paykeys.token(order.paykeyId),
    amount: order.amountCents,
    currency: 'USD',
    description: `Brewbox order ${orderId}`,
    payment_date: easternToday(),
    consent_type: 'internet',
    device: { ip_address: order.ip },
    external_id: externalId,
    config: { balance_check: 'enabled' },
    'Idempotency-Key': idempotencyKey('chg', externalId),
  });
  await db.orders.recordCharge(orderId, charge.data.id);
  return charge.data.id;
}
