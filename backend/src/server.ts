import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function bootstrap() {
  const app = await createApp();

  app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        provider: env.TTS_PROVIDER
      },
      "VoiceForge backend is listening"
    );
  });
}

void bootstrap();
