import rateLimit from "express-rate-limit";

import { env } from "../config/env";

export const ttsRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many text-to-speech requests. Please wait a moment and try again."
  }
});
