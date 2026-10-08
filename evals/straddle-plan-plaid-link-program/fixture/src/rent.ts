import { db } from './db';

export async function rentDue(tenantId: string, month: string) {
  const lease = await db.leases.forTenant(tenantId);
  return { tenantId, month, amountCents: lease.rentCents };
}

// TODO: collect rent from the tenant's linked bank account with Straddle.
export async function collectRent(_tenantId: string, _month: string) {
  throw new Error('not implemented');
}
