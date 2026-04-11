"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRouter = createHealthRouter;
const express_1 = require("express");
function createHealthRouter(runtimeEnv) {
    const router = (0, express_1.Router)();
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
