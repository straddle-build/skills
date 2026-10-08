// Paya `status_id` values this app reacts to.
export function duesStateFor(statusId: number): 'processing' | 'paid' | 'unpaid' | 'charged_back' {
  switch (statusId) {
    case 131: // Pending Origination
    case 132: // Originating
    case 133: // Originated
      return 'processing';
    case 134: // Settled
      return 'paid';
    case 136: // Rejected
    case 301: // Declined
    case 201: // Voided
      return 'unpaid';
    case 331: // Charged Back
      return 'charged_back';
    default:
      return 'processing';
  }
}

export async function setDuesState(transactionApiId: string, state: string, returnDate?: string): Promise<void> {
  console.log('dues', transactionApiId, state, returnDate ?? '');
}
