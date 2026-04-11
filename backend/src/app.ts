import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env, type RuntimeEnv } from "./config/env";
import { HistoryRepository } from "./db/historyRepository";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createHealthRouter } from "./routes/health";
import { createHistoryRouter } from "./routes/history";
import { createTtsRouter } from "./routes/tts";
import { AudioStorage } from "./services/audioStorage";
import {
  createTtsProvider,
  type TtsProvider,
  type TtsProviderFactoryConfig
} from "./services/ttsProvider";
import { AppError } from "./utils/errors";
import { logger } from "./utils/logger";

type CreateAppOptions = {
  env?: RuntimeEnv;
  provider?: TtsProvider;
  historyRepository?: HistoryRepository;
  audioStorage?: AudioStorage;
};

function matchesOrigin(origin: string, pattern: string) {
  if (pattern === "*") {
    return true;
  }

  if (pattern === origin) {
    return true;
  }

  if (!pattern.includes("*")) {
    return false;
  }

  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedPattern.replace(/\\\*/g, ".*")}$`);
  return regex.test(origin);
}

function buildProviderConfig(runtimeEnv: RuntimeEnv): TtsProviderFactoryConfig {
  return {
    provider: runtimeEnv.TTS_PROVIDER,
    maxTextLength: runtimeEnv.MAX_TEXT_LENGTH,
    kokoroServiceUrl: runtimeEnv.KOKORO_SERVICE_URL,
    kokoroServiceApiKey: runtimeEnv.KOKORO_SERVICE_API_KEY,
    kokoroServiceTimeoutMs: runtimeEnv.KOKORO_SERVICE_TIMEOUT_MS
  };
}

export async function createApp(options: CreateAppOptions = {}) {
  const runtimeEnv = options.env ?? env;
  const provider =
    options.provider ?? createTtsProvider(buildProviderConfig(runtimeEnv));
  const historyRepository =
    options.historyRepository ??
    (await HistoryRepository.create(runtimeEnv.DATABASE_PATH));
  const audioStorage =
    options.audioStorage ??
    new AudioStorage(runtimeEnv.AUDIO_STORAGE_PATH, runtimeEnv.BACKEND_BASE_URL);

  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        const isAllowed = runtimeEnv.CORS_ORIGIN_LIST.some((pattern) =>
          matchesOrigin(origin, pattern)
        );

        if (isAllowed) {
          return callback(null, true);
        }

        return callback(new AppError(403, "Origin is not allowed by CORS."));
      }
    })
  );
  app.use(
    pinoHttp({
      logger
    })
  );
  app.use(express.json({ limit: runtimeEnv.REQUEST_BODY_LIMIT }));
  app.use(
    "/audio",
    express.static(runtimeEnv.AUDIO_STORAGE_PATH, {
      fallthrough: false,
      immutable: runtimeEnv.NODE_ENV === "production",
      maxAge: runtimeEnv.NODE_ENV === "production" ? "30d" : 0,
      setHeaders(res) {
        res.setHeader(
          "Cache-Control",
          runtimeEnv.NODE_ENV === "production"
            ? "public, max-age=2592000, immutable"
            : "no-store"
        );
        res.setHeader("Accept-Ranges", "bytes");
      }
    })
  );
  app.use("/health", createHealthRouter(runtimeEnv));
  app.use("/api/history", createHistoryRouter(historyRepository));
  app.use("/api/tts", createTtsRouter(provider, historyRepository, audioStorage));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
