// Paya Connect publishes no SDK, so we call its REST API directly.
const BASE = process.env.PAYA_ENV === 'production' ? 'https://api.payaconnect.com' : 'https://api.sandbox.payaconnect.com';

export const ACH_PRODUCT_TRANSACTION_ID = process.env.PAYA_ACH_PRODUCT_TRANSACTION_ID!;

export async function payaRequest(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'developer-id': process.env.PAYA_DEVELOPER_ID!,
      'user-id': process.env.PAYA_USER_ID!,
      'user-api-key': process.env.PAYA_USER_API_KEY!,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Paya ${method} ${path} failed with ${res.status}`);
  return res.json();
}
