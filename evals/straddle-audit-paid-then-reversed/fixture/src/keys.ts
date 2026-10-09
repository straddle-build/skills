import { createHash } from 'node:crypto';

// A 36-character idempotency key per intent: the prefix plus the first 32 hex characters of a SHA-256 of the intent.
export function idempotencyKey(prefix: string, intent: string): string {
  return `${prefix}-${createHash('sha256').update(intent).digest('hex').slice(0, 32)}`;
}

// Today's date in US Eastern time, for payment_date.
export function easternToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}
