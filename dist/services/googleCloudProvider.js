"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCloudTtsProvider = void 0;
const text_to_speech_1 = require("@google-cloud/text-to-speech");
const speechStyling_1 = require("./speechStyling");
const voicePresentation_1 = require("./voicePresentation");
const CAPABILITIES = {
    speed: true,
    pitch: true,
    volume: true,
    emotions: true,
    languageDetection: true
};
class GoogleCloudTtsProvider {
    name = "google";
    maxTextLength;
    client;
    voiceCache;
    constructor(config) {
        const credentials = JSON.parse(config.credentialsJson);
        this.maxTextLength = Math.min(config.maxTextLength, 5000);
        this.client = new text_to_speech_1.TextToSpeechClient({
            projectId: config.projectId,
            credentials: {
                client_email: credentials.client_email,
                private_key: credentials.private_key
            }
        });
    }
    getCapabilities() {
        return CAPABILITIES;
    }
    async getVoices() {
        const now = Date.now();
        if (this.voiceCache && this.voiceCache.expiresAt > now) {
            return this.voiceCache.voices;
        }
        const [response] = await this.client.listVoices({});
        const voices = (response.voices ?? [])
            .filter((voice) => voice.name)
            .map((voice) => {
            const primaryLanguage = voice.languageCodes?.[0] ?? null;
            const accent = primaryLanguage?.split("-").slice(1).join("-") ?? null;
            return (0, voicePresentation_1.createVoicePresentation)({
                id: voice.name,
                languages: voice.languageCodes ?? [],
                accent,
                gender: voice.ssmlGender ? String(voice.ssmlGender) : null,
                provider: this.name
            });
        })
            .sort((left, right) => {
            if (left.sortOrder !== right.sortOrder) {
                return left.sortOrder - right.sortOrder;
            }
            return left.displayName.localeCompare(right.displayName);
        });
        this.voiceCache = {
            expiresAt: now + 10 * 60 * 1000,
            voices
        };
        return voices;
    }
    async generateSpeech(input) {
        const appliedStyle = (0, speechStyling_1.applySpeechStyle)({
            text: input.text,
            emotion: input.emotion,
            speed: input.speed,
            pitch: input.pitch,
            volume: input.volume
        });
        const [response] = await this.client.synthesizeSpeech({
            input: {
                ssml: appliedStyle.ssml
            },
            voice: {
                languageCode: input.language,
                name: input.voice
            },
            audioConfig: {
                audioEncoding: "MP3"
            }
        });
        const audioContent = response.audioContent;
        const audioBuffer = typeof audioContent === "string"
            ? Buffer.from(audioContent, "base64")
            : Buffer.from(audioContent ?? new Uint8Array());
        return {
            audioBuffer,
            contentType: "audio/mpeg",
            extension: "mp3",
            provider: this.name,
            resolvedVoice: input.voice,
            resolvedVoiceLabel: input.voiceLabel,
            resolvedLanguage: input.language,
            metadata: {
                emotion: input.emotion,
                speakingRate: appliedStyle.speakingRate,
                pitch: appliedStyle.pitch,
                volumeGainDb: appliedStyle.volumeGainDb,
                audioEncoding: "MP3"
            }
        };
    }
}
exports.GoogleCloudTtsProvider = GoogleCloudTtsProvider;
