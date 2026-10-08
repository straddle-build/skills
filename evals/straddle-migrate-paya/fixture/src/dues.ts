import { ACH_PRODUCT_TRANSACTION_ID, payaRequest } from './paya';

// Monthly dues from the member's saved account vault. Members accept the debit terms online when they join.
export async function chargeDues(memberId: string, period: string, accountVaultId: string, dollars: string) {
  const { transaction } = await payaRequest('POST', '/v2/transactions', {
    transaction: {
      action: 'debit',
      payment_method: 'ach',
      ach_sec_code: 'WEB',
      account_vault_id: accountVaultId,
      product_transaction_id: ACH_PRODUCT_TRANSACTION_ID,
      transaction_amount: dollars,
      transaction_api_id: `dues-${memberId}-${period}`,
      description: `Dues ${period}`,
    },
  });
  // An HTTP 200 is not an approval: check status_id.
  return { id: transaction.id, statusId: Number(transaction.status_id) };
}

// Front-desk staff take a past-due payment that the member authorizes over the phone.
export async function chargeByPhone(memberId: string, accountVaultId: string, dollars: string, checkNumber: string) {
  const { transaction } = await payaRequest('POST', '/v2/transactions', {
    transaction: {
      action: 'debit',
      payment_method: 'ach',
      ach_sec_code: 'TEL',
      check_number: checkNumber,
      account_vault_id: accountVaultId,
      product_transaction_id: ACH_PRODUCT_TRANSACTION_ID,
      transaction_amount: dollars,
      transaction_api_id: `phone-${memberId}-${checkNumber}`,
    },
  });
  return { id: transaction.id, statusId: Number(transaction.status_id) };
}

// Refunds a settled dues debit in full when a member cancels in their first week.
export async function refundDues(transactionId: string, dollars: string) {
  const { transaction } = await payaRequest('POST', '/v2/transactions', {
    transaction: {
      action: 'refund',
      payment_method: 'ach',
      previous_transaction_id: transactionId,
      product_transaction_id: ACH_PRODUCT_TRANSACTION_ID,
      transaction_amount: dollars,
    },
  });
  return { id: transaction.id, statusId: Number(transaction.status_id) };
}
