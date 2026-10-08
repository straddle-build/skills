import { plaid } from './plaid';
import { db } from './db';

// Monthly membership debit through Plaid Transfer: authorize, then create the transfer.
export async function chargeMembership(memberId: string, period: string) {
  const member = await db.members.get(memberId);
  const amount = (member.monthlyCents / 100).toFixed(2);
  const authorization = await plaid.transferAuthorizationCreate({
    access_token: member.plaidAccessToken,
    account_id: member.plaidAccountId,
    type: 'debit',
    network: 'ach',
    amount,
    ach_class: 'web',
    user: { legal_name: member.name },
  });
  if (authorization.data.authorization.decision !== 'approved') {
    await db.invoices.markFailed(memberId, period, authorization.data.authorization.decision_rationale?.code ?? 'declined');
    return null;
  }
  const transfer = await plaid.transferCreate({
    access_token: member.plaidAccessToken,
    account_id: member.plaidAccountId,
    authorization_id: authorization.data.authorization.id,
    description: `Dues ${period}`,
  });
  await db.invoices.recordTransfer(memberId, period, transfer.data.transfer.id);
  return transfer.data.transfer.id;
}

// Plaid Transfer status to the invoice's state.
export function invoiceState(status: string) {
  switch (status) {
    case 'pending':
    case 'posted':
      return 'processing';
    case 'funds_available':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'returned':
      return 'returned';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'processing';
  }
}
