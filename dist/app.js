"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./config/env");
const historyRepository_1 = require("./db/historyRepository");
const errorHandler_1 = require("./middleware/errorHandler");
const health_1 = require("./routes/health");
const history_1 = require("./routes/history");
const tts_1 = require("./routes/tts");
const audioStorage_1 = require("./services/audioStorage");
const ttsProvider_1 = require("./services/ttsProvider");
const errors_1 = require("./utils/errors");
const logger_1 = require("./utils/logger");
function matchesOrigin(origin, pattern) {
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
function buildProviderConfig(runtimeEnv) {
    return {
        provider: runtimeEnv.TTS_PROVIDER,
        maxTextLength: runtimeEnv.MAX_TEXT_LENGTH,
        kokoroServiceUrl: runtimeEnv.KOKORO_SERVICE_URL,
        kokoroServiceApiKey: runtimeEnv.KOKORO_SERVICE_API_KEY,
        kokoroServiceTimeoutMs: runtimeEnv.KOKORO_SERVICE_TIMEOUT_MS
    };
}
async function createApp(options = {}) {
    const runtimeEnv = options.env ?? env_1.env;
    const provider = options.provider ?? (0, ttsProvider_1.createTtsProvider)(buildProviderConfig(runtimeEnv));
    const historyRepository = options.historyRepository ??
        (await historyRepository_1.HistoryRepository.create(runtimeEnv.DATABASE_PATH));
    const audioStorage = options.audioStorage ??
        new audioStorage_1.AudioStorage(runtimeEnv.AUDIO_STORAGE_PATH, runtimeEnv.BACKEND_BASE_URL);
    const app = (0, express_1.default)();
    app.disable("x-powered-by");
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }
            const isAllowed = runtimeEnv.CORS_ORIGIN_LIST.some((pattern) => matchesOrigin(origin, pattern));
            if (isAllowed) {
                return callback(null, true);
            }
            return callback(new errors_1.AppError(403, "Origin is not allowed by CORS."));
        }
    }));
    app.use((0, pino_http_1.default)({
        logger: logger_1.logger
    }));
    app.use(express_1.default.json({ limit: runtimeEnv.REQUEST_BODY_LIMIT }));
    app.use("/audio", express_1.default.static(runtimeEnv.AUDIO_STORAGE_PATH));
    app.use("/health", (0, health_1.createHealthRouter)(runtimeEnv));
    app.use("/api/history", (0, history_1.createHistoryRouter)(historyRepository));
    app.use("/api/tts", (0, tts_1.createTtsRouter)(provider, historyRepository, audioStorage));
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
