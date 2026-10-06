import { router } from "./routes.js";
import { straddle } from "./straddle.js";

router.post("/admin/refund", async (req, res) => {
  const payout = await straddle.payouts.create({ ...req.body, external_id: `admin-${Date.now()}` });
  res.json(payout);
});
