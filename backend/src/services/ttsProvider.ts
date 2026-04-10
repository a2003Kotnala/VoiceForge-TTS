import { AppError } from "../utils/errors";
import { GoogleCloudTtsProvider } from "./googleCloudProvider";
import { MockTtsProvider } from "./mockProvider";

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

export type GenerateSpeechInput = {
  text: string;
  voice: string;
  language: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  requestId?: string;
};

export type GeneratedSpeech = {
  audioBuffer: Buffer;
  contentType: string;
  extension: string;
  provider: string;
  resolvedVoice: string;
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
  provider: "google" | "mock";
  maxTextLength: number;
  googleCloudProjectId?: string;
  googleCloudCredentialsJson?: string;
};

class UnavailableTtsProvider implements TtsProvider {
  public readonly name: string;
  public readonly maxTextLength: number;

  constructor(name: string, maxTextLength: number, private readonly message: string) {
    this.name = name;
    this.maxTextLength = maxTextLength;
  }

  getCapabilities(): TtsCapabilities {
    return {
      speed: true,
      pitch: true,
      volume: true
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

  if (!config.googleCloudProjectId || !config.googleCloudCredentialsJson) {
    return new UnavailableTtsProvider(
      "google",
      config.maxTextLength,
      "Google Cloud Text-to-Speech is not configured. Add GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_CREDENTIALS_JSON."
    );
  }

  try {
    return new GoogleCloudTtsProvider({
      maxTextLength: config.maxTextLength,
      projectId: config.googleCloudProjectId,
      credentialsJson: config.googleCloudCredentialsJson
    });
  } catch (error) {
    return new UnavailableTtsProvider(
      "google",
      config.maxTextLength,
      error instanceof Error
        ? error.message
        : "Google Cloud Text-to-Speech credentials could not be parsed."
    );
  }
}
