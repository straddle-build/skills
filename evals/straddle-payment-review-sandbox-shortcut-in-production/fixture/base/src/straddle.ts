import Straddle from "@straddlecom/straddle";

const bearer = process.env.STRADDLE_API_KEY;
const baseURL = process.env.STRADDLE_BASE_URL;
if (!bearer || !baseURL) throw new Error("STRADDLE_API_KEY and STRADDLE_BASE_URL must be set");

export const straddle = new Straddle({ bearer, baseURL });
