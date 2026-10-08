import StraddleAPI from '@straddlecom/straddle';

const BASE_URLS = { sandbox: 'https://sandbox.straddle.com', production: 'https://production.straddle.com' } as const;

function setting(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Straddle configuration error: ${name} is not set`);
  return value;
}

const environment = setting('STRADDLE_ENVIRONMENT');
if (!(environment in BASE_URLS)) {
  throw new Error('Straddle configuration error: STRADDLE_ENVIRONMENT must be sandbox or production');
}

// Direct integration: no call sends Straddle-Account-Id.
export const straddle = new StraddleAPI({
  bearer: setting('STRADDLE_API_KEY'),
  baseURL: BASE_URLS[environment as keyof typeof BASE_URLS],
  maxRetries: 0,
});
