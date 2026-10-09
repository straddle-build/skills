import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { db } from './db';

// Tenants link their bank with Plaid Link. Rentroll keeps the Item and mints processor tokens for the company that
// moves the rent; Plaid moves no money.
const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? 'sandbox'],
  baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID, 'PLAID-SECRET': process.env.PLAID_SECRET } },
}));

export async function createLinkToken(tenantId: string) {
  const res = await plaid.linkTokenCreate({
    user: { client_user_id: tenantId },
    client_name: 'Rentroll',
    products: ['auth'],
    country_codes: ['US'],
    language: 'en',
  });
  return res.data.link_token;
}

export async function onLinkSuccess(tenantId: string, publicToken: string, accountId: string) {
  const exchange = await plaid.itemPublicTokenExchange({ public_token: publicToken });
  await db.tenants.saveItem(tenantId, exchange.data.item_id, exchange.data.access_token, accountId);
}

export async function processorTokenFor(tenantId: string, processor: string) {
  const tenant = await db.tenants.get(tenantId);
  const res = await plaid.processorTokenCreate({ access_token: tenant.accessToken, account_id: tenant.accountId, processor: processor as any });
  return res.data.processor_token;
}
