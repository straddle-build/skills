// Payliance has no SDK, so we call its ACH API directly.
const BASE = process.env.PAYLIANCE_ENV === 'production' ? 'https://api.payliance.com' : 'https://sandbox.api.payliance.com';

export interface PaylianceResult {
  successful: boolean;
  ValidationCode?: string;
  TransactionId?: string;
  UniqueTranId?: string;
  Status?: number;
}

export async function payliance<T = PaylianceResult>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api/v1/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.PAYLIANCE_SECRET_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Payliance ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}
