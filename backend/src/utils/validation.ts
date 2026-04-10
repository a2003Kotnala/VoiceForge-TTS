import { z } from "zod";

import { env } from "../config/env";

export function sanitizeInputText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const numericControl = (min: number, max: number) =>
  z.coerce.number().min(min).max(max).optional();

export const generateSpeechSchema = z
  .object({
    text: z.string().min(1).max(env.MAX_TEXT_LENGTH),
    voice: z.string().trim().min(1).max(120),
    language: z.string().trim().min(2).max(24),
    speed: numericControl(0.25, 2),
    pitch: numericControl(-20, 20),
    volume: numericControl(-96, 16)
  })
  .transform((payload) => ({
    ...payload,
    text: sanitizeInputText(payload.text)
  }))
  .superRefine((payload, ctx) => {
    if (!payload.text) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Text must contain at least one visible character.",
        path: ["text"]
      });
    }
  });

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(25).default(10)
});
