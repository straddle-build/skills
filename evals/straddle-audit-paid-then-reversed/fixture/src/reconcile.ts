import { straddle } from './straddle';
import { db } from './db';

const SIGN: Record<string, Record<string, number>> = {
  deposit: { credit: 1, debit: -1, reversal: -1, failed: 0 },
  withdrawal: { credit: -1, debit: 1, reversal: 1, failed: 0 },
};

// A payment is settled in the books only when its funding event is paid and its line nets into that event.
export async function reconcileFundingEvent(funding: any) {
  await db.funding.save(funding);
  if (funding.status !== 'paid') return;
  const payments = await straddle.fundingEvents.listPayments(funding.id);
  let net = 0;
  for (const line of payments.data) {
    net += SIGN[funding.direction][line.reason] * Math.abs(line.funding_amount);
    if (line.reason !== 'failed') await db.ledger.settlePayment(line.id, funding.id, line.funding_amount);
  }
  await db.funding.recordMatch(funding.id, { bankAmount: funding.amount, paymentsNet: net, matched: net === funding.amount });
}
