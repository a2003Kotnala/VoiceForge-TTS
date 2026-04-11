"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const defaultDatabasePath = node_path_1.default.join(process.cwd(), "data", "voiceforge.db");
const defaultAudioStoragePath = node_path_1.default.join(process.cwd(), "storage", "audio");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: zod_1.z
        .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .default("info"),
    TTS_PROVIDER: zod_1.z.enum(["kokoro", "mock"]).default("kokoro"),
    KOKORO_SERVICE_URL: zod_1.z.string().url().optional(),
    KOKORO_SERVICE_API_KEY: zod_1.z.string().trim().optional(),
    KOKORO_SERVICE_TIMEOUT_MS: zod_1.z.coerce.number().int().min(1000).default(60_000),
    CORS_ORIGINS: zod_1.z.string().default("http://localhost:3000"),
    BACKEND_BASE_URL: zod_1.z.string().url().optional(),
    DATABASE_PATH: zod_1.z.string().default(defaultDatabasePath),
    AUDIO_STORAGE_PATH: zod_1.z.string().default(defaultAudioStoragePath),
    MAX_TEXT_LENGTH: zod_1.z.coerce.number().int().min(100).max(5000).default(3200),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().min(1000).default(60_000),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().int().min(1).default(12),
    REQUEST_BODY_LIMIT: zod_1.z.string().default("32kb")
});
const parsedEnv = envSchema.parse(process.env);
function splitOrigins(value) {
    return value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}
exports.env = {
    ...parsedEnv,
    BACKEND_BASE_URL: parsedEnv.BACKEND_BASE_URL ?? `http://localhost:${parsedEnv.PORT}`,
    CORS_ORIGIN_LIST: splitOrigins(parsedEnv.CORS_ORIGINS),
    PROVIDER_CONFIGURED: parsedEnv.TTS_PROVIDER === "mock"
        ? true
        : Boolean(parsedEnv.KOKORO_SERVICE_URL)
};
