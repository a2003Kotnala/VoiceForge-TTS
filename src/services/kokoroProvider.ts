import { AppError } from "../utils/errors";
import type {
  GenerateSpeechInput,
  GeneratedSpeech,
  TtsCapabilities,
  TtsProvider,
  VoiceOption
} from "./ttsProvider";

type KokoroProviderConfig = {
  serviceUrl: string;
  apiKey?: string;
  timeoutMs: number;
  maxTextLength: number;
  fetchImpl?: typeof fetch;
};

type KokoroVoicesResponse = {
  provider: string;
  model: string;
  voices: VoiceOption[];
};

const CAPABILITIES: TtsCapabilities = {
  emotions: true,
  speed: true,
  pitch: true,
  expressiveness: true,
  languageDetection: true
};

function withNoTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as {
      detail?: string;
      error?: string;
      message?: string;
    };

    return payload.detail ?? payload.error ?? payload.message ?? "Request failed.";
  }

  return (await response.text()) || "Request failed.";
}

export class KokoroProvider implements TtsProvider {
  public readonly name = "kokoro";
  public readonly maxTextLength: number;

  private readonly serviceUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private voiceCache:
    | {
        expiresAt: number;
        voices: VoiceOption[];
      }
    | undefined;

  constructor(config: KokoroProviderConfig) {
    this.maxTextLength = config.maxTextLength;
    this.serviceUrl = withNoTrailingSlash(config.serviceUrl);
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  getCapabilities(): TtsCapabilities {
    return CAPABILITIES;
  }

  async getVoices(): Promise<VoiceOption[]> {
    const now = Date.now();

    if (this.voiceCache && this.voiceCache.expiresAt > now) {
      return this.voiceCache.voices;
    }

    const response = await this.performRequest("/voices", {
      method: "GET"
    });

    if (!response.ok) {
      throw new AppError(503, await parseError(response));
    }

    const payload = (await response.json()) as KokoroVoicesResponse;

    this.voiceCache = {
      expiresAt: now + 10 * 60 * 1000,
      voices: payload.voices
    };

    return payload.voices;
  }

  async generateSpeech(input: GenerateSpeechInput): Promise<GeneratedSpeech> {
    const response = await this.performRequest("/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: input.text,
        voice_id: input.voice,
        language: input.language,
        emotion: input.emotion,
        speed: input.speed,
        pitch: input.pitch,
        expressiveness: input.expressiveness,
        pauses: input.pauses,
        request_id: input.requestId
      })
    });

    if (!response.ok) {
      throw new AppError(502, await parseError(response));
    }

    const contentType = response.headers.get("content-type") ?? "audio/wav";
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = contentType.includes("mpeg") ? "mp3" : "wav";

    return {
      audioBuffer: buffer,
      contentType,
      extension,
      provider: this.name,
      resolvedVoice:
        response.headers.get("x-kokoro-voice-id") ?? input.voice ?? "kokoro-default",
      resolvedVoiceLabel:
        response.headers.get("x-kokoro-voice-label") ??
        input.voiceLabel ??
        "Kokoro voice",
      resolvedLanguage:
        response.headers.get("x-kokoro-language") ?? input.language ?? "en-IN",
      metadata: {
        emotion: input.emotion,
        speed: Number(response.headers.get("x-kokoro-speed") ?? input.speed ?? 1),
        pitch: Number(response.headers.get("x-kokoro-pitch") ?? input.pitch ?? 0),
        expressiveness: Number(
          response.headers.get("x-kokoro-expressiveness") ??
            input.expressiveness ??
            0.5
        ),
        pauses: Number(response.headers.get("x-kokoro-pauses") ?? input.pauses ?? 1),
        cacheHit: response.headers.get("x-kokoro-cache-hit") === "1",
        model: response.headers.get("x-kokoro-model") ?? "Kokoro-82M"
      }
    };
  }

  private async performRequest(path: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = new Headers(init.headers);

      if (this.apiKey) {
        headers.set("x-service-key", this.apiKey);
      }

      return await this.fetchImpl(`${this.serviceUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError(
          504,
          "Kokoro took too long to respond. Please try a shorter passage or try again in a moment."
        );
      }

      throw new AppError(
        503,
        error instanceof Error
          ? `Kokoro service is unavailable: ${error.message}`
          : "Kokoro service is unavailable."
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
