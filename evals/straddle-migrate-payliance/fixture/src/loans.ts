import { payliance, PaylianceResult } from './payliance';

export interface Installment {
  id: string;
  loanId: string;
  dueDate: string; // YYYY-MM-DD
  amount: number; // dollars, for example 182.37
}

// Borrowers sign the repayment authorization online when the loan is approved; each installment is
// scheduled with Payliance for its due date.
export async function scheduleInstallment(installment: Installment, bankAccountId: string) {
  const result = await payliance('echeck/tokenizeddebit', {
    UniqueTranId: `inst-${installment.id}`,
    BankAccountId: bankAccountId,
    CheckAmount: installment.amount,
    SecCode: 'WEB',
    WebType: 'R',
    FutureDate: installment.dueDate,
  });
  // Validation failures come back as HTTP 200 with successful: false.
  if (!result.successful) throw new Error(`installment ${installment.id} rejected: ValidationCode ${result.ValidationCode}`);
  return result;
}

// Sends the loan proceeds to the borrower's bank.
export async function disburseLoan(loanId: string, bankAccountId: string, amount: number) {
  const result = await payliance('echeck/tokenizedcredit', {
    UniqueTranId: `disb-${loanId}`,
    BankAccountId: bankAccountId,
    CheckAmount: amount,
    SecCode: 'PPD',
  });
  if (!result.successful) throw new Error(`disbursement ${loanId} rejected: ValidationCode ${result.ValidationCode}`);
  return result;
}

// A repeated UniqueTranId is rejected, not replayed, so after a timeout look the debit up before retrying.
export async function findInstallment(installmentId: string) {
  return payliance<PaylianceResult>('echeck/retrieve', { UniqueTranId: `inst-${installmentId}` });
}

// Payliance status codes for an installment.
export function installmentStateFor(status: number): 'scheduled' | 'processing' | 'paid' | 'missed' | 'void' | 'rejected' {
  switch (status) {
    case 1: return 'rejected'; // Invalidated
    case 2: return 'scheduled'; // Pending
    case 4: return 'processing'; // Sent to bank
    case 16: return 'paid'; // Settled
    case 8: // Returned
    case 24: // Settled then Returned
      return 'missed';
    case 32: return 'void'; // Voided
    default: return 'processing';
  }
}

export async function setInstallmentState(uniqueTranId: string, state: string, returnReason?: string): Promise<void> {
  console.log('installment', uniqueTranId, state, returnReason ?? '');
}
