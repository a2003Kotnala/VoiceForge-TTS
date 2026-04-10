import { randomUUID } from "node:crypto";

import { Router } from "express";

import type { HistoryRepository } from "../db/historyRepository";
import { ttsRateLimiter } from "../middleware/rateLimiter";
import { AudioStorage } from "../services/audioStorage";
import type { TtsProvider } from "../services/ttsProvider";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { generateSpeechSchema } from "../utils/validation";

export function createTtsRouter(
  provider: TtsProvider,
  historyRepository: HistoryRepository,
  audioStorage: AudioStorage
) {
  const router = Router();

  router.get(
    "/voices",
    asyncHandler(async (_req, res) => {
      const voices = await provider.getVoices();

      res.json({
        provider: provider.name,
        capabilities: provider.getCapabilities(),
        maxTextLength: provider.maxTextLength,
        voices
      });
    })
  );

  router.post(
    "/generate",
    ttsRateLimiter,
    asyncHandler(async (req, res) => {
      const input = generateSpeechSchema.parse(req.body);

      if (input.text.length > provider.maxTextLength) {
        throw new AppError(
          400,
          `Text exceeds the ${provider.name} provider limit of ${provider.maxTextLength} characters.`
        );
      }

      const id = randomUUID();
      const timestamp = new Date().toISOString();

      historyRepository.createPending({
        id,
        text: input.text,
        voice: input.voice,
        language: input.language,
        provider: provider.name,
        metadata: {
          requestedSpeed: input.speed ?? 1,
          requestedPitch: input.pitch ?? 0,
          requestedVolume: input.volume ?? 0
        },
        createdAt: timestamp
      });

      try {
        const generated = await provider.generateSpeech({
          ...input,
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
      } catch (error) {
        historyRepository.markFailed(id, {
          errorMessage:
            error instanceof Error
              ? error.message
              : "Failed to generate speech.",
          updatedAt: new Date().toISOString()
        });

        throw error;
      }
    })
  );

  return router;
}
