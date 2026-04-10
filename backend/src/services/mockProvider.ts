import type {
  GenerateSpeechInput,
  GeneratedSpeech,
  TtsCapabilities,
  TtsProvider,
  VoiceOption
} from "./ttsProvider";

const SAMPLE_RATE = 22050;

const CAPABILITIES: TtsCapabilities = {
  speed: true,
  pitch: true,
  volume: true
};

const VOICES: VoiceOption[] = [
  {
    id: "mock-aurora",
    name: "Aurora",
    languages: ["en-US"],
    accent: "US",
    gender: "FEMALE",
    provider: "mock"
  },
  {
    id: "mock-sohan",
    name: "Sohan",
    languages: ["en-IN", "hi-IN"],
    accent: "IN",
    gender: "MALE",
    provider: "mock"
  }
];

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createWavTone(durationSeconds: number, pitchModifier: number, volume: number) {
  const frameCount = Math.floor(SAMPLE_RATE * durationSeconds);
  const dataLength = frameCount * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  const baseFrequency = 220 + pitchModifier * 8;
  const amplitude = Math.min(Math.max((volume + 96) / 112, 0.12), 0.95) * 0.6;

  for (let index = 0; index < frameCount; index += 1) {
    const envelope = 1 - index / frameCount;
    const sample =
      Math.sin((2 * Math.PI * baseFrequency * index) / SAMPLE_RATE) *
      amplitude *
      envelope;

    view.setInt16(44 + index * 2, sample * 32767, true);
  }

  return Buffer.from(buffer);
}

export class MockTtsProvider implements TtsProvider {
  public readonly name = "mock";
  public readonly maxTextLength: number;

  constructor(maxTextLength: number) {
    this.maxTextLength = maxTextLength;
  }

  getCapabilities(): TtsCapabilities {
    return CAPABILITIES;
  }

  async getVoices(): Promise<VoiceOption[]> {
    return VOICES;
  }

  async generateSpeech(input: GenerateSpeechInput): Promise<GeneratedSpeech> {
    const durationSeconds = Math.min(
      Math.max(input.text.length / 90, 0.8),
      4
    );

    return {
      audioBuffer: createWavTone(
        durationSeconds,
        input.pitch ?? 0,
        input.volume ?? 0
      ),
      contentType: "audio/wav",
      extension: "wav",
      provider: this.name,
      resolvedVoice: input.voice,
      resolvedLanguage: input.language,
      metadata: {
        note: "Mock provider returns a generated tone for local smoke testing.",
        requestedSpeed: input.speed ?? 1,
        requestedPitch: input.pitch ?? 0,
        requestedVolume: input.volume ?? 0
      }
    };
  }
}
