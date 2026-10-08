import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? 'sandbox'],
  baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID, 'PLAID-SECRET': process.env.PLAID_SECRET } },
}));

export async function createLinkToken(memberId: string) {
  const res = await plaid.linkTokenCreate({
    user: { client_user_id: memberId },
    client_name: 'Liftclub',
    products: ['auth', 'transfer'],
    country_codes: ['US'],
    language: 'en',
  });
  return res.data.link_token;
}
