export interface Order {
  id: string;
  ownerId: string;
  amountCents: number;
  currency: "USD";
  paykey: string;
  chargeId?: string;
  tipChargeId?: string;
  chargeStatus?: string;
}

const orders = new Map<string, Order>();
const events = new Set<string>();

export async function getOrder(id: string): Promise<Order | undefined> {
  return orders.get(id);
}

export async function saveOrder(order: Order): Promise<void> {
  orders.set(order.id, order);
}

export async function findOrderByCharge(chargeId: string): Promise<Order | undefined> {
  return [...orders.values()].find((o) => o.chargeId === chargeId || o.tipChargeId === chargeId);
}

// Returns false when the event was already stored, so a repeated delivery changes nothing.
export async function saveEvent(id: string): Promise<boolean> {
  if (events.has(id)) return false;
  events.add(id);
  return true;
}
