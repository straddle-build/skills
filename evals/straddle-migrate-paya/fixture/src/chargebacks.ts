import { payaRequest } from './paya';
import { setDuesState } from './memberships';

// Nightly job: picks up ACH returns by reading the day's charged-back transactions.
export async function syncChargebacks(fromTs: number, toTs: number) {
  const page = await payaRequest(
    'GET',
    `/v2/transactions?status_id=331&modified_ts=custom&modified_ts_from=${fromTs}&modified_ts_to=${toTs}`,
  );
  for (const transaction of page.list ?? []) {
    await setDuesState(transaction.transaction_api_id, 'charged_back', transaction.return_date);
  }
}
