const assert = require("node:assert/strict");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { mkdtemp, rm } = require("node:fs/promises");

const request = require("supertest");

const {
  analyzeTextSchema,
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
    language: "en-IN",
    emotion: "neutral"
  });

  assert.equal(result.success, false);

  const validAnalysis = analyzeTextSchema.safeParse({
    text: "  Hola equipo, gracias por revisar esto.  "
  });

  assert.equal(validAnalysis.success, true);
  assert.equal(validAnalysis.data.text, "Hola equipo, gracias por revisar esto.");

  const validGenerate = generateSpeechSchema.safeParse({
    text: "Hello team",
    emotion: "friendly",
    speed: 1,
    pitch: 0.2,
    expressiveness: 0.6
  });

  assert.equal(validGenerate.success, true);
}

async function withFakeKokoroService(task) {
  const mockProvider = new MockTtsProvider(3200);
  const mockResult = await mockProvider.generateSpeech({
    text: "Hello from Kokoro",
    voice: "mock-indian-natural",
    voiceLabel: "Indian English - Natural",
    language: "en-IN",
    emotion: "friendly",
    speed: 1,
    pitch: 0,
    expressiveness: 0.5
  });

  const voicesPayload = {
    provider: "kokoro",
    model: "Kokoro-82M",
    voices: [
      {
        id: "en-IN-natural",
        name: "en-IN-natural",
        displayName: "Indian English - Natural",
        description: "Balanced Indian English voice for everyday speech.",
        presentation: "Everyday",
        accentLabel: "English (India)",
        languages: ["en-IN"],
        provider: "kokoro",
        quality: "Kokoro 82M",
        recommended: true,
        sortOrder: 1
      }
    ]
  };

  const server = http.createServer((req, res) => {
    if (req.url === "/voices" && req.method === "GET") {
      res.writeHead(200, {
        "content-type": "application/json"
      });
      res.end(JSON.stringify(voicesPayload));
      return;
    }

    if (req.url === "/synthesize" && req.method === "POST") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const payload = JSON.parse(body);
        assert.equal(payload.voice_id, "en-IN-natural");
        assert.equal(payload.language, "en-IN");
        assert.equal(payload.emotion, "friendly");

        res.writeHead(200, {
          "content-type": "audio/wav",
          "x-kokoro-model": "Kokoro-82M",
          "x-kokoro-voice-id": "en-IN-natural",
          "x-kokoro-voice-label": "Indian English - Natural",
          "x-kokoro-language": "en-IN",
          "x-kokoro-speed": "1.000",
          "x-kokoro-pitch": "0.100",
          "x-kokoro-expressiveness": "0.650",
          "x-kokoro-cache-hit": "0"
        });
        res.end(mockResult.audioBuffer);
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const serviceUrl = `http://127.0.0.1:${address.port}`;

  try {
    await task(serviceUrl);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

async function withBrokenKokoroService(task) {
  const server = http.createServer((req, res) => {
    if (req.url === "/voices" && req.method === "GET") {
      res.writeHead(502, {
        "content-type": "text/html"
      });
      res.end("<!DOCTYPE html><html><body><h1>502 Bad Gateway</h1></body></html>");
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const serviceUrl = `http://127.0.0.1:${address.port}`;

  try {
    await task(serviceUrl);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

async function withFlakyKokoroService(task) {
  const mockProvider = new MockTtsProvider(3200);
  const mockResult = await mockProvider.generateSpeech({
    text: "Hello from Kokoro",
    voice: "mock-indian-natural",
    voiceLabel: "Indian English - Natural",
    language: "en-IN",
    emotion: "friendly"
  });

  let voicesRequestCount = 0;

  const server = http.createServer((req, res) => {
    if (req.url === "/voices" && req.method === "GET") {
      voicesRequestCount += 1;

      if (voicesRequestCount === 1) {
        res.writeHead(503, {
          "content-type": "application/json"
        });
        res.end(JSON.stringify({ detail: "warming up" }));
        return;
      }

      res.writeHead(200, {
        "content-type": "application/json"
      });
      res.end(
        JSON.stringify({
          provider: "kokoro",
          model: "Kokoro-82M",
          voices: [
            {
              id: "en-IN-natural",
              name: "en-IN-natural",
              displayName: "Indian English - Natural",
              description: "Balanced Indian English voice for everyday speech.",
              presentation: "Everyday",
              accentLabel: "English (India)",
              languages: ["en-IN"],
              provider: "kokoro",
              quality: "Kokoro 82M",
              recommended: true,
              sortOrder: 1
            }
          ]
        })
      );
      return;
    }

    if (req.url === "/synthesize" && req.method === "POST") {
      res.writeHead(200, {
        "content-type": "audio/wav",
        "x-kokoro-model": "Kokoro-82M",
        "x-kokoro-voice-id": "en-IN-natural",
        "x-kokoro-voice-label": "Indian English - Natural",
        "x-kokoro-language": "en-IN",
        "x-kokoro-speed": "1.000",
        "x-kokoro-pitch": "0.000",
        "x-kokoro-expressiveness": "0.500",
        "x-kokoro-cache-hit": "0"
      });
      res.end(mockResult.audioBuffer);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const serviceUrl = `http://127.0.0.1:${address.port}`;

  try {
    await task(serviceUrl, () => voicesRequestCount);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

async function runProviderTests() {
  const mockProvider = createTtsProvider({
    provider: "mock",
    maxTextLength: 300,
    kokoroServiceTimeoutMs: 5000
  });

  const mockVoices = await mockProvider.getVoices();
  const mockVoice = mockVoices[0];
  const mockResult = await mockProvider.generateSpeech({
    text: "VoiceForge test run",
    voice: mockVoice.id,
    voiceLabel: mockVoice.displayName,
    language: mockVoice.languages[0],
    emotion: "friendly"
  });

  assert.equal(mockProvider.name, "mock");
  assert.ok(mockVoices.length > 0);
  assert.ok(mockResult.audioBuffer.byteLength > 44);
  assert.equal(mockResult.metadata.emotion, "friendly");
  assert.equal(mockResult.resolvedVoiceLabel, mockVoice.displayName);

  await withFakeKokoroService(async (serviceUrl) => {
    const kokoroProvider = createTtsProvider({
      provider: "kokoro",
      maxTextLength: 3200,
      kokoroServiceUrl: serviceUrl,
      kokoroServiceTimeoutMs: 5000
    });

    const voices = await kokoroProvider.getVoices();
    assert.equal(voices[0].id, "en-IN-natural");

    const result = await kokoroProvider.generateSpeech({
      text: "Hello from VoiceForge",
      voice: "en-IN-natural",
      voiceLabel: "Indian English - Natural",
      language: "en-IN",
      emotion: "friendly",
      expressiveness: 0.7
    });

    assert.equal(kokoroProvider.name, "kokoro");
    assert.equal(result.resolvedVoice, "en-IN-natural");
    assert.equal(result.resolvedLanguage, "en-IN");
    assert.equal(result.extension, "wav");
    assert.equal(result.metadata.model, "Kokoro-82M");
  });

  await withBrokenKokoroService(async (serviceUrl) => {
    const kokoroProvider = createTtsProvider({
      provider: "kokoro",
      maxTextLength: 3200,
      kokoroServiceUrl: serviceUrl,
      kokoroServiceTimeoutMs: 5000
    });

    await assert.rejects(
      () => kokoroProvider.getVoices(),
      (error) => {
        assert.equal(error.name, "AppError");
        assert.equal(error.statusCode, 503);
        assert.match(
          error.message,
          /Kokoro is unavailable on Render right now/i
        );
        return true;
      }
    );
  });

  await withFlakyKokoroService(async (serviceUrl, getCount) => {
    const kokoroProvider = createTtsProvider({
      provider: "kokoro",
      maxTextLength: 3200,
      kokoroServiceUrl: serviceUrl,
      kokoroServiceTimeoutMs: 5000,
      kokoroServiceRetryCount: 1
    });

    const voices = await kokoroProvider.getVoices();
    assert.equal(voices[0].id, "en-IN-natural");
    assert.equal(getCount(), 2);
  });
}

async function createTestRuntime() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "voiceforge-"));
  const runtimeEnv = {
    NODE_ENV: "test",
    PORT: 4000,
    LOG_LEVEL: "silent",
    TTS_PROVIDER: "mock",
    KOKORO_SERVICE_URL: undefined,
    KOKORO_SERVICE_API_KEY: undefined,
    KOKORO_SERVICE_TIMEOUT_MS: 5000,
    KOKORO_SERVICE_RETRY_COUNT: 1,
    CORS_ORIGINS: "http://localhost:3000",
    CORS_ORIGIN_LIST: ["http://localhost:3000"],
    BACKEND_BASE_URL: "http://localhost:4000",
    DATABASE_PATH: path.join(tempDir, "history.db"),
    AUDIO_STORAGE_PATH: path.join(tempDir, "audio"),
    MAX_TEXT_LENGTH: 3200,
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
      assert.equal(response.body.provider, "mock");
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
      const analysisResponse = await request(app)
        .post("/api/tts/analyze")
        .send({
          text: "Hello team, thanks for checking this update."
        });

      assert.equal(analysisResponse.status, 200);
      assert.equal(analysisResponse.body.detectedLanguage.code, "en-IN");
      assert.equal(analysisResponse.body.suggestedEmotion, "friendly");
      assert.equal(analysisResponse.body.recommendedVoiceId, "mock-indian-natural");

      const response = await request(app).post("/api/tts/generate").send({
        text: "Hello team, thanks for checking this update.",
        voice: "mock-indian-natural",
        voiceLabel: "Indian English - Natural",
        language: "en-IN",
        emotion: "friendly",
        speed: 1,
        pitch: 0,
        expressiveness: 0.5
      });

      assert.equal(response.status, 201);
      assert.equal(response.body.status, "completed");
      assert.match(response.body.audioUrl, /\/audio\//);
      assert.equal(response.body.voice, "mock-indian-natural");
      assert.equal(response.body.voiceLabel, "Indian English - Natural");
      assert.equal(response.body.emotion, "friendly");

      const historyResponse = await request(app).get("/api/history");

      assert.equal(historyResponse.status, 200);
      assert.equal(historyResponse.body.items.length, 1);
      assert.equal(historyResponse.body.items[0].id, response.body.id);
      assert.equal(historyResponse.body.items[0].emotion, "friendly");
      assert.equal(
        historyResponse.body.items[0].voiceLabel,
        "Indian English - Natural"
      );
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
