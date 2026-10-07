import express from "express";
import { router } from "./routes.ts";

const app = express();
app.use("/api", router);
app.listen(3000);
