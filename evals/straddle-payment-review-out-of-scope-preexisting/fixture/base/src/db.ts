export interface Order {
  id: string;
  ownerId: string;
  amountCents: number;
  currency: "USD";
  paykey: string;
  chargeId?: string;
}

const orders = new Map<string, Order>();

export async function getOrder(id: string): Promise<Order | undefined> {
  return orders.get(id);
}

export async function saveOrder(order: Order): Promise<void> {
  orders.set(order.id, order);
}

export async function saveEvent(id: string, payload: unknown): Promise<boolean> {
  return !orders.has(`event:${id}`) && orders.set(`event:${id}`, payload as Order) !== undefined;
}
