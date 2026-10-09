// Persistence for orders, paykeys, events, refunds and the ledger (implementation elided in this fixture).
export type Order = {
  id: string;
  amountCents: number;
  paykeyId: string;
  ip: string;
  chargeId?: string;
  chargeStatus?: string;
  returnReason?: string;
  refundId?: string;
  resubmitChargeId?: string;
  fundingIds?: string[];
};

export const db: any = {};
