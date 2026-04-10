export type TtsCapabilities = {
  speed: boolean;
  pitch: boolean;
  volume: boolean;
};

export type VoiceOption = {
  id: string;
  name: string;
  languages: string[];
  accent?: string | null;
  gender?: string | null;
  provider: string;
};

export type VoicesResponse = {
  provider: string;
  capabilities: TtsCapabilities;
  maxTextLength: number;
  voices: VoiceOption[];
};

export type HistoryRecord = {
  id: string;
  text: string;
  voice: string;
  language: string;
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
  voice: string;
  language: string;
  speed?: number;
  pitch?: number;
  volume?: number;
};

export type HistoryResponse = {
  items: HistoryRecord[];
};
