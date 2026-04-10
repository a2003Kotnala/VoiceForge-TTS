const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const { mkdtemp, rm } = require("node:fs/promises");

const request = require("supertest");

const {
  generateSpeechSchema,
  sanitizeInputText
} = require("../dist/utils/validation.js");
const { createTtsProvider } = require("../dist/services/ttsProvider.js");
const { createApp } = require("../dist/app.js");
const { HistoryRepository } = require("../dist/db/historyRepository.js");
const { AudioStorage } = require("../dist/services/audioStorage.js");
const { MockTtsProvider } = require("../dist/services/mockProvider.js");

async function runValidationTests() {
  assert.equal(sanitizeInputText("  Hello\u0007   world  "), "Hello world");

  const result = generateSpeechSchema.safeParse({
    text: "   ",
    voice: "en-US-Wavenet-D",
    language: "en-US"
  });

  assert.equal(result.success, false);
}

async function runProviderTests() {
  const provider = createTtsProvider({
    provider: "mock",
    maxTextLength: 300
  });

  const voices = await provider.getVoices();
  const result = await provider.generateSpeech({
    text: "VoiceForge test run",
    voice: voices[0].id,
    language: voices[0].languages[0]
  });

  assert.equal(provider.name, "mock");
  assert.ok(voices.length > 0);
  assert.ok(result.audioBuffer.byteLength > 44);
}

async function createTestRuntime() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "voiceforge-"));
  const runtimeEnv = {
    NODE_ENV: "test",
    PORT: 4000,
    LOG_LEVEL: "silent",
    TTS_PROVIDER: "mock",
    GOOGLE_CLOUD_PROJECT_ID: undefined,
    GOOGLE_CLOUD_CREDENTIALS_JSON: undefined,
    CORS_ORIGINS: "http://localhost:3000",
    CORS_ORIGIN_LIST: ["http://localhost:3000"],
    BACKEND_BASE_URL: "http://localhost:4000",
    DATABASE_PATH: path.join(tempDir, "history.db"),
    AUDIO_STORAGE_PATH: path.join(tempDir, "audio"),
    MAX_TEXT_LENGTH: 4500,
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 10,
    REQUEST_BODY_LIMIT: "32kb",
    PROVIDER_CONFIGURED: true
  };

  const historyRepository = await HistoryRepository.create(runtimeEnv.DATABASE_PATH);
  const app = await createApp({
    env: runtimeEnv,
    provider: new MockTtsProvider(runtimeEnv.MAX_TEXT_LENGTH),
    historyRepository,
    audioStorage: new AudioStorage(
      runtimeEnv.AUDIO_STORAGE_PATH,
      runtimeEnv.BACKEND_BASE_URL
    )
  });

  return {
    app,
    historyRepository,
    tempDir
  };
}

async function runRouteTests() {
  {
    const { app, historyRepository, tempDir } = await createTestRuntime();

    try {
      const response = await request(app).get("/health");

      assert.equal(response.status, 200);
      assert.equal(response.body.status, "ok");
    } finally {
      historyRepository.close();
      await rm(tempDir, {
        recursive: true,
        force: true
      });
    }
  }

  {
    const { app, historyRepository, tempDir } = await createTestRuntime();

    try {
      const response = await request(app).post("/api/tts/generate").send({
        text: "Test request",
        voice: "mock-aurora",
        language: "en-US",
        speed: 1,
        pitch: 0,
        volume: 0
      });

      assert.equal(response.status, 201);
      assert.equal(response.body.status, "completed");
      assert.match(response.body.audioUrl, /\/audio\//);

      const historyResponse = await request(app).get("/api/history");

      assert.equal(historyResponse.status, 200);
      assert.equal(historyResponse.body.items.length, 1);
      assert.equal(historyResponse.body.items[0].id, response.body.id);
    } finally {
      historyRepository.close();
      await rm(tempDir, {
        recursive: true,
        force: true
      });
    }
  }
}

async function run(name, task) {
  await task();
  console.log(`PASS ${name}`);
}

async function main() {
  await run("validation", runValidationTests);
  await run("provider", runProviderTests);
  await run("routes", runRouteTests);
}

main().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
