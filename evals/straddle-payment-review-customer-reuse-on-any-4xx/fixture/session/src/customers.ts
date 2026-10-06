import Straddle from "@straddlecom/straddle";
import type { Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.js";
import { router } from "./routes.js";
import { straddle } from "./straddle.js";

router.post("/customers", requireUser, async (req, res: Response) => {
  const { user } = req as AuthedRequest;
  const email = String(req.body.email);
  try {
    const customer = await straddle.customers.create(
      { type: "individual", name: String(req.body.name), email, phone: String(req.body.phone), address: req.body.address, device: { ip_address: req.ip ?? "0.0.0.0" }, external_id: `owner-${user.id}` },
      { headers: { "Idempotency-Key": `customer-${user.id}` } },
    );
    return res.json({ customerId: customer.data.id });
  } catch (err) {
    if (err instanceof Straddle.APIError && err.status >= 400 && err.status < 500) {
      const existing = await straddle.customers.list({ search_text: email });
      if (existing.data[0]) return res.json({ customerId: existing.data[0].id });
    }
    throw err;
  }
});
