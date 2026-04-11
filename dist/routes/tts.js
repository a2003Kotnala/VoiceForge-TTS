"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTtsRouter = createTtsRouter;
const node_crypto_1 = require("node:crypto");
const express_1 = require("express");
const rateLimiter_1 = require("../middleware/rateLimiter");
const textAnalysis_1 = require("../services/textAnalysis");
const ttsProvider_1 = require("../services/ttsProvider");
const asyncHandler_1 = require("../utils/asyncHandler");
const errors_1 = require("../utils/errors");
const validation_1 = require("../utils/validation");
function createTtsRouter(provider, historyRepository, audioStorage) {
    const router = (0, express_1.Router)();
    function pickVoice(voices, language, voiceId) {
        if (voiceId) {
            return voices.find((voice) => voice.id === voiceId) ?? null;
        }
        const matchingVoices = voices.filter((voice) => voice.languages.includes(language));
        return (matchingVoices.find((voice) => voice.recommended) ??
            matchingVoices[0] ??
            null);
    }
    router.get("/voices", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const voices = await provider.getVoices();
        const defaultVoice = voices.find((voice) => voice.recommended && voice.languages.includes("en-IN")) ??
            voices.find((voice) => voice.recommended) ??
            voices[0] ??
            null;
        res.json({
            provider: provider.name,
            capabilities: provider.getCapabilities(),
            maxTextLength: provider.maxTextLength,
            emotions: ttsProvider_1.EMOTION_OPTIONS,
            defaults: {
                language: defaultVoice?.languages[0] ?? "en-IN",
                voice: defaultVoice?.id ?? null,
                emotion: "neutral"
            },
            voices
        });
    }));
    router.post("/analyze", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const input = validation_1.analyzeTextSchema.parse(req.body);
        const voices = await provider.getVoices();
        const supportedLanguages = Array.from(new Set(voices.flatMap((voice) => voice.languages)));
        const detectedLanguage = (0, textAnalysis_1.detectLanguage)(input.text, supportedLanguages);
        const recommendedVoice = pickVoice(voices, detectedLanguage.code) ??
            voices.find((voice) => voice.recommended) ??
            voices[0] ??
            null;
        res.json({
            detectedLanguage,
            suggestedEmotion: (0, textAnalysis_1.suggestEmotion)(input.text),
            recommendedVoiceId: recommendedVoice?.id ?? null
        });
    }));
    router.post("/generate", rateLimiter_1.ttsRateLimiter, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const input = validation_1.generateSpeechSchema.parse(req.body);
        const voices = await provider.getVoices();
        const supportedLanguages = Array.from(new Set(voices.flatMap((voice) => voice.languages)));
        const detectedLanguage = (0, textAnalysis_1.detectLanguage)(input.text, supportedLanguages);
        const resolvedLanguage = input.language ?? detectedLanguage.code;
        const matchedVoice = pickVoice(voices, resolvedLanguage, input.voice);
        if (input.text.length > provider.maxTextLength) {
            throw new errors_1.AppError(400, `Text exceeds the ${provider.name} provider limit of ${provider.maxTextLength} characters.`);
        }
        if (!matchedVoice) {
            throw new errors_1.AppError(400, "The selected voice is no longer available.");
        }
        if (!matchedVoice.languages.includes(resolvedLanguage)) {
            throw new errors_1.AppError(400, "The selected voice does not support the chosen language.");
        }
        const id = (0, node_crypto_1.randomUUID)();
        const timestamp = new Date().toISOString();
        historyRepository.createPending({
            id,
            text: input.text,
            voice: matchedVoice.id,
            voiceLabel: input.voiceLabel ?? matchedVoice.displayName,
            language: resolvedLanguage,
            emotion: input.emotion,
            provider: provider.name,
            metadata: {
                emotion: input.emotion,
                detectedLanguage: detectedLanguage.code,
                detectedLanguageConfidence: detectedLanguage.confidence,
                requestedPace: input.speed ?? 1,
                requestedPitch: input.pitch ?? 0,
                requestedExpressiveness: input.expressiveness ?? 0.5,
                requestedPauses: input.pauses ?? 1,
                voicePresentation: matchedVoice.presentation,
                voiceQuality: matchedVoice.quality ?? null
            },
            createdAt: timestamp
        });
        try {
            const generated = await provider.generateSpeech({
                ...input,
                voice: matchedVoice.id,
                requestId: id
            });
            const savedAudio = await audioStorage.saveAudio(id, {
                buffer: generated.audioBuffer,
                extension: generated.extension
            });
            const record = historyRepository.markCompleted(id, {
                audioUrl: savedAudio.publicUrl,
                metadata: generated.metadata,
                updatedAt: new Date().toISOString()
            });
            res.status(201).json(record);
        }
        catch (error) {
            historyRepository.markFailed(id, {
                errorMessage: error instanceof Error
                    ? error.message
                    : "Failed to generate speech.",
                updatedAt: new Date().toISOString()
            });
            throw error;
        }
    }));
    return router;
}
