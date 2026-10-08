import express from 'express';
import { duesStateFor, setDuesState } from './memberships';

export const payaPostbacks = express.Router();

// Paya postbacks are form-encoded with the transaction as a JSON string in `data`. Paya signs nothing,
// so the postback config sends Basic auth credentials we check here.
payaPostbacks.post('/postbacks/paya', express.urlencoded({ extended: false }), async (req, res) => {
  const user = process.env.PAYA_POSTBACK_USER!;
  const password = process.env.PAYA_POSTBACK_PASSWORD!;
  const expected = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  if (req.header('authorization') !== expected) return res.sendStatus(401);
  const transaction = JSON.parse(req.body.data);
  await setDuesState(transaction.transaction_api_id, duesStateFor(Number(transaction.status_id)));
  res.sendStatus(200);
});
