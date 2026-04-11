"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMOTION_OPTIONS = exports.EMOTION_IDS = void 0;
exports.createTtsProvider = createTtsProvider;
const errors_1 = require("../utils/errors");
const kokoroProvider_1 = require("./kokoroProvider");
const mockProvider_1 = require("./mockProvider");
exports.EMOTION_IDS = [
    "neutral",
    "calm",
    "friendly",
    "professional",
    "serious",
    "cheerful",
    "sad",
    "angry",
    "excited",
    "storytelling"
];
exports.EMOTION_OPTIONS = [
    {
        id: "neutral",
        label: "Neutral",
        description: "Clear and even for everyday reading."
    },
    {
        id: "calm",
        label: "Calm",
        description: "Softer pacing with a more relaxed delivery."
    },
    {
        id: "friendly",
        label: "Friendly",
        description: "Warm and approachable without sounding casual."
    },
    {
        id: "professional",
        label: "Professional",
        description: "Steady and composed for meetings, updates, and explainers."
    },
    {
        id: "serious",
        label: "Serious",
        description: "Grounded and lower-energy for weightier passages."
    },
    {
        id: "cheerful",
        label: "Cheerful",
        description: "Light and upbeat for positive messages."
    },
    {
        id: "sad",
        label: "Sad",
        description: "Gentler pacing for reflective or difficult copy."
    },
    {
        id: "angry",
        label: "Angry",
        description: "Sharper and firmer when the text needs force."
    },
    {
        id: "excited",
        label: "Excited",
        description: "Higher energy with more lift and urgency."
    },
    {
        id: "storytelling",
        label: "Storytelling",
        description: "Slightly more expressive with room between ideas."
    }
];
class UnavailableTtsProvider {
    message;
    name;
    maxTextLength;
    constructor(name, maxTextLength, message) {
        this.message = message;
        this.name = name;
        this.maxTextLength = maxTextLength;
    }
    getCapabilities() {
        return {
            emotions: true,
            speed: true,
            pitch: true,
            expressiveness: true,
            languageDetection: true
        };
    }
    async getVoices() {
        throw new errors_1.AppError(503, this.message);
    }
    async generateSpeech(_input) {
        throw new errors_1.AppError(503, this.message);
    }
}
function createTtsProvider(config) {
    if (config.provider === "mock") {
        return new mockProvider_1.MockTtsProvider(config.maxTextLength);
    }
    if (!config.kokoroServiceUrl) {
        return new UnavailableTtsProvider("kokoro", config.maxTextLength, "Kokoro is not configured. Add KOKORO_SERVICE_URL so the backend can reach the Kokoro inference service.");
    }
    return new kokoroProvider_1.KokoroProvider({
        maxTextLength: config.maxTextLength,
        serviceUrl: config.kokoroServiceUrl,
        apiKey: config.kokoroServiceApiKey,
        timeoutMs: config.kokoroServiceTimeoutMs
    });
}
