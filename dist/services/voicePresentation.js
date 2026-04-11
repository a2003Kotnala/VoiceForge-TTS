"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVoicePresentation = createVoicePresentation;
const LANGUAGE_NAMES = new Intl.DisplayNames(["en"], {
    type: "language"
});
const REGION_NAMES = new Intl.DisplayNames(["en"], {
    type: "region"
});
function getVoiceFamily(voiceName) {
    if (voiceName.includes("Chirp3")) {
        return "Chirp3";
    }
    if (voiceName.includes("Studio")) {
        return "Studio";
    }
    if (voiceName.includes("Neural2")) {
        return "Neural2";
    }
    if (voiceName.includes("Wavenet")) {
        return "Wavenet";
    }
    if (voiceName.includes("News")) {
        return "News";
    }
    if (voiceName.includes("Standard")) {
        return "Standard";
    }
    return "Neural";
}
function getVoicePriority(family) {
    switch (family) {
        case "Chirp3":
            return 0;
        case "Studio":
            return 1;
        case "Neural2":
            return 2;
        case "Wavenet":
            return 3;
        case "News":
            return 4;
        case "Standard":
            return 5;
        default:
            return 6;
    }
}
function formatLanguageLabel(languageCode) {
    const [baseLanguage, regionCode] = languageCode.split("-");
    const language = LANGUAGE_NAMES.of(baseLanguage) ?? baseLanguage;
    const region = regionCode ? REGION_NAMES.of(regionCode) : undefined;
    return region ? `${language} (${region})` : language;
}
function formatPresentation(gender) {
    const normalized = gender?.toUpperCase();
    switch (normalized) {
        case "FEMALE":
            return "Feminine";
        case "MALE":
            return "Masculine";
        default:
            return "Balanced";
    }
}
function createVoicePresentation(input) {
    const primaryLanguage = input.languages[0] ?? "en-US";
    const family = getVoiceFamily(input.id);
    const quality = family === "Standard" ? "Standard" : "Neural";
    const presentation = formatPresentation(input.gender);
    const accentLabel = formatLanguageLabel(primaryLanguage);
    const voice = {
        id: input.id,
        name: input.id,
        displayName: `${accentLabel} / ${presentation}`,
        description: family === "Standard"
            ? "Simple, clear delivery with less expressive range."
            : `${family} voice with a cleaner, more natural speaking style.`,
        family,
        quality,
        presentation,
        accent: input.accent,
        accentLabel,
        languages: input.languages,
        gender: input.gender ?? null,
        provider: input.provider,
        sortOrder: getVoicePriority(family)
    };
    return voice;
}
