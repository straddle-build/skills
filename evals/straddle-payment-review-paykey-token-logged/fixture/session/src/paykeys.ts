import type { Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

router.post("/bank/link", requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const paykey = await straddle.bridge.link.plaid(
    { customer_id: `owner-${user.id}`, plaid_token: String(req.body.plaidToken) },
    { headers: { "Idempotency-Key": `link-${user.id}-${String(req.body.plaidToken).slice(-8)}` } },
  );
  console.log("linked bank account", { owner: user.id, paykey: paykey.data.paykey });
  res.json({ id: paykey.data.id, label: paykey.data.label });
});
