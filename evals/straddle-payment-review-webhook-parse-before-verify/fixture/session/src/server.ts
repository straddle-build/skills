import express from "express";
import "./webhooks.ts";
import { router } from "./routes.ts";

const app = express();
app.use("/api", router);
app.listen(Number(process.env.PORT ?? 3000));
