import { dwolla, MAIN_FUNDING_SOURCE } from './dwolla';

// Shown to a household before it saves a bank account for visit billing.
export async function visitAuthorization() {
  const res = await dwolla.post('on-demand-authorizations');
  return { href: res.headers.get('location'), bodyText: res.body.bodyText, buttonText: res.body.buttonText };
}

// Pulls a household's payment for a finished cleaning visit into our bank.
export async function collectVisit(visitId: string, householdFundingSource: string, amount: string) {
  const res = await dwolla.post(
    'transfers',
    {
      _links: { source: { href: householdFundingSource }, destination: { href: MAIN_FUNDING_SOURCE } },
      amount: { currency: 'USD', value: amount },
      correlationId: `visit-${visitId}`,
    },
    { 'Idempotency-Key': `visit-${visitId}` },
  );
  // We store the transfer URL as the payment's ID.
  return res.headers.get('location');
}

// Sends a cleaner's weekly earnings to their bank.
export async function payCleaner(payrunId: string, cleanerId: string, cleanerFundingSource: string, amount: string) {
  const res = await dwolla.post(
    'transfers',
    {
      _links: { source: { href: MAIN_FUNDING_SOURCE }, destination: { href: cleanerFundingSource } },
      amount: { currency: 'USD', value: amount },
      correlationId: `pay-${payrunId}-${cleanerId}`,
    },
    { 'Idempotency-Key': `pay-${payrunId}-${cleanerId}` },
  );
  return res.headers.get('location');
}
