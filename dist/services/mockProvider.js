"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTtsProvider = void 0;
const speechStyling_1 = require("./speechStyling");
const SAMPLE_RATE = 22050;
const CAPABILITIES = {
    emotions: true,
    speed: true,
    pitch: true,
    expressiveness: true,
    languageDetection: true
};
const VOICES = [
    {
        id: "mock-indian-natural",
        name: "mock-indian-natural",
        displayName: "Indian English - Natural",
        description: "Balanced and everyday, with a steady Indian-English feel.",
        presentation: "Everyday",
        accentLabel: "English (India)",
        languages: ["en-IN"],
        provider: "mock",
        quality: "Mock",
        recommended: true,
        sortOrder: 1
    },
    {
        id: "mock-indian-clear",
        name: "mock-indian-clear",
        displayName: "Indian English - Clear",
        description: "More stable for meetings, notes, and explainers.",
        presentation: "Clear",
        accentLabel: "English (India)",
        languages: ["en-IN"],
        provider: "mock",
        quality: "Mock",
        sortOrder: 2
    },
    {
        id: "mock-hindi-natural",
        name: "mock-hindi-natural",
        displayName: "Hindi - Natural",
        description: "Conversational Hindi with softer pacing.",
        presentation: "Conversational",
        accentLabel: "Hindi (India)",
        languages: ["hi-IN"],
        provider: "mock",
        quality: "Mock",
        recommended: true,
        sortOrder: 3
    },
    {
        id: "mock-british-clear",
        name: "mock-british-clear",
        displayName: "British English - Clear",
        description: "A clean fallback voice for British English copy.",
        presentation: "Clear",
        accentLabel: "English (United Kingdom)",
        languages: ["en-GB"],
        provider: "mock",
        quality: "Mock",
        sortOrder: 4
    }
];
function writeString(view, offset, value) {
    for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
    }
}
function createWavTone(durationSeconds, pitchShift, expressiveness, emotionOffset) {
    const frameCount = Math.floor(SAMPLE_RATE * durationSeconds);
    const dataLength = frameCount * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);
    const baseFrequency = 205 + pitchShift * 18 + emotionOffset;
    const amplitude = 0.22 + expressiveness * 0.28;
    for (let index = 0; index < frameCount; index += 1) {
        const envelope = 1 - index / frameCount;
        const vibrato = Math.sin((2 * Math.PI * (baseFrequency / 22) * index) / SAMPLE_RATE) *
            (2 + expressiveness * 8);
        const sample = Math.sin((2 * Math.PI * (baseFrequency + vibrato) * index) / SAMPLE_RATE) *
            amplitude *
            envelope;
        view.setInt16(44 + index * 2, sample * 32767, true);
    }
    return Buffer.from(buffer);
}
class MockTtsProvider {
    name = "mock";
    maxTextLength;
    constructor(maxTextLength) {
        this.maxTextLength = maxTextLength;
    }
    getCapabilities() {
        return CAPABILITIES;
    }
    async getVoices() {
        return VOICES;
    }
    async generateSpeech(input) {
        const appliedStyle = (0, speechStyling_1.applySpeechStyle)({
            emotion: input.emotion,
            speed: input.speed,
            pitch: input.pitch,
            expressiveness: input.expressiveness,
            pauses: input.pauses
        });
        const pauseMultiplier = input.pauses ?? 1;
        const durationSeconds = Math.min(Math.max((input.text.length / 95) * (1 / appliedStyle.speakingRate) * pauseMultiplier, 0.8), 6);
        return {
            audioBuffer: createWavTone(durationSeconds, appliedStyle.pitch, appliedStyle.expressiveness, input.emotion === "sad"
                ? -14
                : input.emotion === "cheerful"
                    ? 12
                    : input.emotion === "excited"
                        ? 18
                        : input.emotion === "angry"
                            ? 10
                            : 0),
            contentType: "audio/wav",
            extension: "wav",
            provider: this.name,
            resolvedVoice: input.voice ?? "mock-indian-natural",
            resolvedVoiceLabel: input.voiceLabel ?? "Indian English - Natural",
            resolvedLanguage: input.language ?? "en-IN",
            metadata: {
                note: "Mock provider returns a generated tone for local smoke testing.",
                emotion: input.emotion,
                speakingRate: appliedStyle.speakingRate,
                pitch: appliedStyle.pitch,
                expressiveness: appliedStyle.expressiveness,
                pauses: pauseMultiplier
            }
        };
    }
}
exports.MockTtsProvider = MockTtsProvider;
