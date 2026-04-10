import { Router } from "express";

import type { RuntimeEnv } from "../config/env";

export function createHealthRouter(runtimeEnv: RuntimeEnv) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      status: runtimeEnv.PROVIDER_CONFIGURED ? "ok" : "degraded",
      service: "voiceforge-backend",
      provider: runtimeEnv.TTS_PROVIDER,
      providerConfigured: runtimeEnv.PROVIDER_CONFIGURED,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
