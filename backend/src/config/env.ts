import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const defaultDatabasePath = path.join(process.cwd(), "data", "voiceforge.db");
const defaultAudioStoragePath = path.join(process.cwd(), "storage", "audio");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  TTS_PROVIDER: z.enum(["kokoro", "mock"]).default("kokoro"),
  KOKORO_SERVICE_URL: z.string().url().optional(),
  KOKORO_SERVICE_API_KEY: z.string().trim().optional(),
  KOKORO_SERVICE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(60_000),
  KOKORO_SERVICE_RETRY_COUNT: z.coerce.number().int().min(0).max(3).default(1),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  BACKEND_BASE_URL: z.string().url().optional(),
  DATABASE_PATH: z.string().default(defaultDatabasePath),
  AUDIO_STORAGE_PATH: z.string().default(defaultAudioStoragePath),
  MAX_TEXT_LENGTH: z.coerce.number().int().min(100).max(5000).default(3200),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(12),
  REQUEST_BODY_LIMIT: z.string().default("32kb")
});

const parsedEnv = envSchema.parse(process.env);

function splitOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export type RuntimeEnv = typeof parsedEnv & {
  BACKEND_BASE_URL: string;
  CORS_ORIGIN_LIST: string[];
  PROVIDER_CONFIGURED: boolean;
};

export const env: RuntimeEnv = {
  ...parsedEnv,
  BACKEND_BASE_URL:
    parsedEnv.BACKEND_BASE_URL ?? `http://localhost:${parsedEnv.PORT}`,
  CORS_ORIGIN_LIST: splitOrigins(parsedEnv.CORS_ORIGINS),
  PROVIDER_CONFIGURED:
    parsedEnv.TTS_PROVIDER === "mock"
      ? true
      : Boolean(parsedEnv.KOKORO_SERVICE_URL)
};
