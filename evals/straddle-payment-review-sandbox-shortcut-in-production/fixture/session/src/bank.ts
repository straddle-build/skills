import express, { type Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

const TEST_BANK = { account_number: "123456789", routing_number: "011000028" };

router.post("/bank/link", express.json(), requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const bank = req.body.useTestBank
    ? TEST_BANK
    : { account_number: String(req.body.accountNumber), routing_number: String(req.body.routingNumber) };
  const paykey = await straddle.bridge.link.bankAccount(
    { customer_id: String(req.body.customerId), account_holder: String(req.body.accountHolder), account_type: "checking", ...bank },
    { headers: { "Idempotency-Key": `bank-${user.id}-${bank.account_number.slice(-4)}` } },
  );
  res.json({ id: paykey.data.id, label: paykey.data.label });
});
