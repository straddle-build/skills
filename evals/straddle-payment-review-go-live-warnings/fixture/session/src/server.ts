import express, { type NextFunction, type Request, type Response } from "express";
import "./checkout.ts";
import "./webhooks.ts";
import { router } from "./routes.ts";

const app = express();
app.use("/api", router);
// Route handlers pass failures to next(); answer them instead of leaving the request hanging. Only the error's name
// is logged, because a message can carry request data.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("request failed", { error: err instanceof Error ? err.name : "unknown" });
  res.status(500).json({ error: "request failed" });
});
app.listen(Number(process.env.PORT ?? 3000));
