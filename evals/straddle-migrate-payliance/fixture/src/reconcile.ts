import cron from 'node-cron';
import { payliance } from './payliance';
import { installmentStateFor, setInstallmentState } from './loans';

interface Row {
  UniqueTranId: string;
  Status: number;
  ReturnReason?: string;
  ReturnAmount?: number;
}

// Payliance sends no webhooks, so every morning after its return cutoff we read the previous day's
// settlements and returns.
export async function reconcile(day: string) {
  const settled = await payliance<{ Transactions: Row[] }>('echeck/querysettlements', { StartDate: day, EndDate: day });
  for (const row of settled.Transactions) {
    await setInstallmentState(row.UniqueTranId, installmentStateFor(row.Status));
  }

  const returned = await payliance<{ Transactions: Row[] }>('echeck/queryreturns', { StartDate: day, EndDate: day });
  for (const row of returned.Transactions) {
    if (row.ReturnAmount === 0) continue; // a NOC; we don't act on these
    // Payliance itself refuses later debits to accounts with unauthorized or fatal returns,
    // so we keep no blocklist of our own.
    await setInstallmentState(row.UniqueTranId, installmentStateFor(row.Status), row.ReturnReason);
  }
}

cron.schedule('30 9 * * 1-5', () => reconcile(new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)));
