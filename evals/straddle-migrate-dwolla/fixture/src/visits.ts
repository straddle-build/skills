// A visit is paid once Dwolla says the transfer is processed.
export function visitStateFor(dwollaStatus: string): 'processing' | 'paid' | 'unpaid' {
  if (dwollaStatus === 'processed') return 'paid';
  if (dwollaStatus === 'failed' || dwollaStatus === 'cancelled') return 'unpaid';
  return 'processing';
}

export async function setVisitState(visitId: string, state: string): Promise<void> {
  console.log('visit', visitId, state);
}

export async function setPayoutState(payoutKey: string, dwollaStatus: string): Promise<void> {
  console.log('payout', payoutKey, dwollaStatus);
}
