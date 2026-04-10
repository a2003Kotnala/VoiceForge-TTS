import { TextToSpeechClient } from "@google-cloud/text-to-speech";

import type {
  GenerateSpeechInput,
  GeneratedSpeech,
  TtsCapabilities,
  TtsProvider,
  VoiceOption
} from "./ttsProvider";

type GoogleCloudProviderConfig = {
  projectId: string;
  credentialsJson: string;
  maxTextLength: number;
};

type GoogleCredentialPayload = {
  client_email: string;
  private_key: string;
};

const CAPABILITIES: TtsCapabilities = {
  speed: true,
  pitch: true,
  volume: true
};

export class GoogleCloudTtsProvider implements TtsProvider {
  public readonly name = "google";
  public readonly maxTextLength: number;

  private readonly client: TextToSpeechClient;
  private voiceCache:
    | {
        expiresAt: number;
        voices: VoiceOption[];
      }
    | undefined;

  constructor(config: GoogleCloudProviderConfig) {
    const credentials = JSON.parse(
      config.credentialsJson
    ) as GoogleCredentialPayload;

    this.maxTextLength = Math.min(config.maxTextLength, 5000);
    this.client = new TextToSpeechClient({
      projectId: config.projectId,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key
      }
    });
  }

  getCapabilities(): TtsCapabilities {
    return CAPABILITIES;
  }

  async getVoices(): Promise<VoiceOption[]> {
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

        return {
          id: voice.name as string,
          name: voice.name as string,
          languages: voice.languageCodes ?? [],
          accent,
          gender: voice.ssmlGender ? String(voice.ssmlGender) : null,
          provider: this.name
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    this.voiceCache = {
      expiresAt: now + 10 * 60 * 1000,
      voices
    };

    return voices;
  }

  async generateSpeech(input: GenerateSpeechInput): Promise<GeneratedSpeech> {
    const [response] = await this.client.synthesizeSpeech({
      input: {
        text: input.text
      },
      voice: {
        languageCode: input.language,
        name: input.voice
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: input.speed ?? 1,
        pitch: input.pitch ?? 0,
        volumeGainDb: input.volume ?? 0
      }
    });

    const audioContent = response.audioContent;
    const audioBuffer =
      typeof audioContent === "string"
        ? Buffer.from(audioContent, "base64")
        : Buffer.from(audioContent ?? new Uint8Array());

    return {
      audioBuffer,
      contentType: "audio/mpeg",
      extension: "mp3",
      provider: this.name,
      resolvedVoice: input.voice,
      resolvedLanguage: input.language,
      metadata: {
        requestedSpeed: input.speed ?? 1,
        requestedPitch: input.pitch ?? 0,
        requestedVolume: input.volume ?? 0,
        audioEncoding: "MP3"
      }
    };
  }
}
