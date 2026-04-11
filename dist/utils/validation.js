"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyQuerySchema = exports.generateSpeechSchema = exports.analyzeTextSchema = void 0;
exports.sanitizeInputText = sanitizeInputText;
const zod_1 = require("zod");
const env_1 = require("../config/env");
const ttsProvider_1 = require("../services/ttsProvider");
function sanitizeInputText(text) {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
const numericControl = (min, max) => zod_1.z.coerce.number().min(min).max(max).optional();
exports.analyzeTextSchema = zod_1.z
    .object({
    text: zod_1.z.string().min(1).max(env_1.env.MAX_TEXT_LENGTH)
})
    .transform((payload) => ({
    ...payload,
    text: sanitizeInputText(payload.text)
}))
    .superRefine((payload, ctx) => {
    if (!payload.text) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Text must contain at least one visible character.",
            path: ["text"]
        });
    }
});
exports.generateSpeechSchema = zod_1.z
    .object({
    text: zod_1.z.string().min(1).max(env_1.env.MAX_TEXT_LENGTH),
    voice: zod_1.z.string().trim().min(1).max(120).optional(),
    voiceLabel: zod_1.z.string().trim().min(1).max(120).optional(),
    language: zod_1.z.string().trim().min(2).max(24).optional(),
    emotion: zod_1.z.enum(ttsProvider_1.EMOTION_IDS),
    speed: numericControl(0.8, 1.2),
    pitch: numericControl(-2, 2),
    expressiveness: numericControl(0, 1),
    pauses: numericControl(0.7, 1.4)
})
    .transform((payload) => ({
    ...payload,
    text: sanitizeInputText(payload.text)
}))
    .superRefine((payload, ctx) => {
    if (!payload.text) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Text must contain at least one visible character.",
            path: ["text"]
        });
    }
});
exports.historyQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(25).default(10)
});
