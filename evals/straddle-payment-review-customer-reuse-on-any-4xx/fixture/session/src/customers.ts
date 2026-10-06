import Straddle from "@straddlecom/straddle";
import express, { type Response } from "express";
import { requireUser, type AuthedRequest } from "./auth.ts";
import { router } from "./routes.ts";
import { straddle } from "./straddle.ts";

router.post("/customers", express.json(), requireUser, async (req, res: Response) => {
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
