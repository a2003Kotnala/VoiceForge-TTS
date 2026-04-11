"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    const app = await (0, app_1.createApp)();
    app.listen(env_1.env.PORT, () => {
        logger_1.logger.info({
            port: env_1.env.PORT,
            provider: env_1.env.TTS_PROVIDER
        }, "VoiceForge backend is listening");
    });
}
void bootstrap();
