export type EmotionOption =
  | "neutral"
  | "calm"
  | "friendly"
  | "professional"
  | "serious"
  | "cheerful"
  | "sad"
  | "angry"
  | "excited"
  | "storytelling";

export type EmotionDescriptor = {
  id: EmotionOption;
  label: string;
  description: string;
};

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

export type VoicesResponse = {
  provider: string;
  capabilities: TtsCapabilities;
  maxTextLength: number;
  emotions: EmotionDescriptor[];
  defaults: {
    language: string;
    voice: string | null;
    emotion: EmotionOption;
  };
  voices: VoiceOption[];
};

export type LanguageDetection = {
  code: string;
  label: string;
  baseLanguage: string;
  confidence: "low" | "medium" | "high";
  needsReview: boolean;
  source: "script" | "keywords" | "fallback";
};

export type TextAnalysisResponse = {
  detectedLanguage: LanguageDetection;
  suggestedEmotion: EmotionOption;
  recommendedVoiceId: string | null;
};

export type HistoryRecord = {
  id: string;
  text: string;
  voice: string;
  voiceLabel: string | null;
  language: string;
  emotion: EmotionOption;
  status: "processing" | "completed" | "failed";
  provider: string;
  audioUrl: string | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GenerateSpeechPayload = {
  text: string;
  voice?: string;
  voiceLabel?: string;
  language?: string;
  emotion: EmotionOption;
  speed?: number;
  pitch?: number;
  expressiveness?: number;
  pauses?: number;
};

export type HistoryResponse = {
  items: HistoryRecord[];
};
