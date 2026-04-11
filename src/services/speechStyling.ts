import type { EmotionOption } from "./ttsProvider";

type AppliedSpeechStyle = {
  speakingRate: number;
  pitch: number;
  expressiveness: number;
};

type EmotionPreset = {
  rate: number;
  pitch: number;
  expressiveness: number;
};

const EMOTION_PRESETS: Record<EmotionOption, EmotionPreset> = {
  neutral: { rate: 1, pitch: 0, expressiveness: 0.45 },
  calm: { rate: 0.92, pitch: -0.3, expressiveness: 0.32 },
  friendly: { rate: 1.01, pitch: 0.2, expressiveness: 0.55 },
  professional: { rate: 0.97, pitch: -0.15, expressiveness: 0.3 },
  serious: { rate: 0.94, pitch: -0.3, expressiveness: 0.26 },
  cheerful: { rate: 1.05, pitch: 0.35, expressiveness: 0.68 },
  sad: { rate: 0.9, pitch: -0.4, expressiveness: 0.42 },
  angry: { rate: 1.06, pitch: 0.25, expressiveness: 0.74 },
  excited: { rate: 1.08, pitch: 0.45, expressiveness: 0.82 },
  storytelling: { rate: 0.96, pitch: 0.1, expressiveness: 0.72 }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function applySpeechStyle(input: {
  emotion: EmotionOption;
  speed?: number;
  pitch?: number;
  expressiveness?: number;
  pauses?: number;
}): AppliedSpeechStyle {
  const preset = EMOTION_PRESETS[input.emotion];

  return {
    speakingRate: clamp((input.speed ?? 1) * preset.rate, 0.8, 1.2),
    pitch: clamp((input.pitch ?? 0) + preset.pitch, -2, 2),
    expressiveness: clamp(
      (input.expressiveness ?? 0.5) * 0.65 + preset.expressiveness * 0.35,
      0,
      1
    )
  };
}
