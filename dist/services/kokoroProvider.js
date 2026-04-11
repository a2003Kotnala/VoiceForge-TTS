"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KokoroProvider = void 0;
const errors_1 = require("../utils/errors");
const CAPABILITIES = {
    emotions: true,
    speed: true,
    pitch: true,
    expressiveness: true,
    languageDetection: true
};
function withNoTrailingSlash(value) {
    return value.replace(/\/$/, "");
}
async function parseError(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        const payload = (await response.json());
        return payload.detail ?? payload.error ?? payload.message ?? "Request failed.";
    }
    return (await response.text()) || "Request failed.";
}
class KokoroProvider {
    name = "kokoro";
    maxTextLength;
    serviceUrl;
    apiKey;
    timeoutMs;
    fetchImpl;
    voiceCache;
    constructor(config) {
        this.maxTextLength = config.maxTextLength;
        this.serviceUrl = withNoTrailingSlash(config.serviceUrl);
        this.apiKey = config.apiKey;
        this.timeoutMs = config.timeoutMs;
        this.fetchImpl = config.fetchImpl ?? fetch;
    }
    getCapabilities() {
        return CAPABILITIES;
    }
    async getVoices() {
        const now = Date.now();
        if (this.voiceCache && this.voiceCache.expiresAt > now) {
            return this.voiceCache.voices;
        }
        const response = await this.performRequest("/voices", {
            method: "GET"
        });
        if (!response.ok) {
            throw new errors_1.AppError(503, await parseError(response));
        }
        const payload = (await response.json());
        this.voiceCache = {
            expiresAt: now + 10 * 60 * 1000,
            voices: payload.voices
        };
        return payload.voices;
    }
    async generateSpeech(input) {
        const response = await this.performRequest("/synthesize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: input.text,
                voice_id: input.voice,
                language: input.language,
                emotion: input.emotion,
                speed: input.speed,
                pitch: input.pitch,
                expressiveness: input.expressiveness,
                pauses: input.pauses,
                request_id: input.requestId
            })
        });
        if (!response.ok) {
            throw new errors_1.AppError(502, await parseError(response));
        }
        const contentType = response.headers.get("content-type") ?? "audio/wav";
        const buffer = Buffer.from(await response.arrayBuffer());
        const extension = contentType.includes("mpeg") ? "mp3" : "wav";
        return {
            audioBuffer: buffer,
            contentType,
            extension,
            provider: this.name,
            resolvedVoice: response.headers.get("x-kokoro-voice-id") ?? input.voice ?? "kokoro-default",
            resolvedVoiceLabel: response.headers.get("x-kokoro-voice-label") ??
                input.voiceLabel ??
                "Kokoro voice",
            resolvedLanguage: response.headers.get("x-kokoro-language") ?? input.language ?? "en-IN",
            metadata: {
                emotion: input.emotion,
                speed: Number(response.headers.get("x-kokoro-speed") ?? input.speed ?? 1),
                pitch: Number(response.headers.get("x-kokoro-pitch") ?? input.pitch ?? 0),
                expressiveness: Number(response.headers.get("x-kokoro-expressiveness") ??
                    input.expressiveness ??
                    0.5),
                pauses: Number(response.headers.get("x-kokoro-pauses") ?? input.pauses ?? 1),
                cacheHit: response.headers.get("x-kokoro-cache-hit") === "1",
                model: response.headers.get("x-kokoro-model") ?? "Kokoro-82M"
            }
        };
    }
    async performRequest(path, init) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const headers = new Headers(init.headers);
            if (this.apiKey) {
                headers.set("x-service-key", this.apiKey);
            }
            return await this.fetchImpl(`${this.serviceUrl}${path}`, {
                ...init,
                headers,
                signal: controller.signal
            });
        }
        catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                throw new errors_1.AppError(504, "Kokoro took too long to respond. Please try a shorter passage or try again in a moment.");
            }
            throw new errors_1.AppError(503, error instanceof Error
                ? `Kokoro service is unavailable: ${error.message}`
                : "Kokoro service is unavailable.");
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.KokoroProvider = KokoroProvider;
