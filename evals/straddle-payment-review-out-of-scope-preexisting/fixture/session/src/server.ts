import express from "express";
import "./legacy-payouts.ts";
import "./tips.ts";
import "./admin-refunds.ts";
import "./checkout.ts";
import { router } from "./routes.ts";

const app = express();
app.use("/api", router);
app.listen(Number(process.env.PORT ?? 3000));
