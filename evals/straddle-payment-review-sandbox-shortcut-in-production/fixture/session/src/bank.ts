import type { Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

const TEST_BANK = { account_number: "123456789", routing_number: "011000028" };

router.post("/bank/link", requireUser, async (req, res: Response) => {
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
