import { Client } from 'dwolla-v2';

export const dwolla = new Client({
  key: process.env.DWOLLA_KEY!,
  secret: process.env.DWOLLA_SECRET!,
  environment: process.env.DWOLLA_ENV === 'production' ? 'production' : 'sandbox',
});

// Our Main Account's verified bank funding source.
export const MAIN_FUNDING_SOURCE = process.env.DWOLLA_MAIN_FUNDING_SOURCE!;
