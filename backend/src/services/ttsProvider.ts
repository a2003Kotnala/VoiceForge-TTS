import { AppError } from "../utils/errors";
import { KokoroProvider } from "./kokoroProvider";
import { MockTtsProvider } from "./mockProvider";

export const EMOTION_IDS = [
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
] as const;

export type EmotionOption = (typeof EMOTION_IDS)[number];

export type EmotionDescriptor = {
  id: EmotionOption;
  label: string;
  description: string;
};

export const EMOTION_OPTIONS: EmotionDescriptor[] = [
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

export type TtsCapabilities = {
  emotions: boolean;
  speed: boolean;
  pitch: boolean;
  expressiveness: boolean;
  languageDetection: boolean;
};

export type VoiceOption = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  presentation: string;
  accentLabel?: string | null;
  languages: string[];
  provider: string;
  quality?: string | null;
  recommended?: boolean;
  previewText?: string | null;
  sortOrder: number;
};

export type GenerateSpeechInput = {
  text: string;
  voice?: string;
  voiceLabel?: string;
  language?: string;
  emotion: EmotionOption;
  speed?: number;
  pitch?: number;
  expressiveness?: number;
  pauses?: number;
  requestId?: string;
};

export type GeneratedSpeech = {
  audioBuffer: Buffer;
  contentType: string;
  extension: string;
  provider: string;
  resolvedVoice: string;
  resolvedVoiceLabel?: string;
  resolvedLanguage: string;
  metadata: Record<string, unknown>;
};

export interface TtsProvider {
  readonly name: string;
  readonly maxTextLength: number;
  getCapabilities(): TtsCapabilities;
  getVoices(): Promise<VoiceOption[]>;
  generateSpeech(input: GenerateSpeechInput): Promise<GeneratedSpeech>;
}

export type TtsProviderFactoryConfig = {
  provider: "kokoro" | "mock";
  maxTextLength: number;
  kokoroServiceUrl?: string;
  kokoroServiceApiKey?: string;
  kokoroServiceTimeoutMs: number;
  kokoroServiceRetryCount?: number;
};

class UnavailableTtsProvider implements TtsProvider {
  public readonly name: string;
  public readonly maxTextLength: number;

  constructor(
    name: string,
    maxTextLength: number,
    private readonly message: string
  ) {
    this.name = name;
    this.maxTextLength = maxTextLength;
  }

  getCapabilities(): TtsCapabilities {
    return {
      emotions: true,
      speed: true,
      pitch: true,
      expressiveness: true,
      languageDetection: true
    };
  }

  async getVoices(): Promise<VoiceOption[]> {
    throw new AppError(503, this.message);
  }

  async generateSpeech(_input: GenerateSpeechInput): Promise<GeneratedSpeech> {
    throw new AppError(503, this.message);
  }
}

export function createTtsProvider(config: TtsProviderFactoryConfig): TtsProvider {
  if (config.provider === "mock") {
    return new MockTtsProvider(config.maxTextLength);
  }

  if (!config.kokoroServiceUrl) {
    return new UnavailableTtsProvider(
      "kokoro",
      config.maxTextLength,
      "Kokoro is not configured. Add KOKORO_SERVICE_URL so the backend can reach the Kokoro inference service."
    );
  }

  return new KokoroProvider({
    maxTextLength: config.maxTextLength,
    serviceUrl: config.kokoroServiceUrl,
    apiKey: config.kokoroServiceApiKey,
    timeoutMs: config.kokoroServiceTimeoutMs,
    retryCount: config.kokoroServiceRetryCount ?? 1
  });
}
