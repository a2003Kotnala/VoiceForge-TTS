# VoiceForge

VoiceForge is a public, no-login text-to-speech app built as a polished creative tool rather than an AI dashboard. The interface is intentionally calm and minimal: paste text, let the app detect the language, choose a voice and tone, generate speech, listen in the built-in audio player, and download the result.

The monorepo is split into three deployable parts:

- `frontend/` — Next.js App Router UI for Vercel
- `backend/` — Express + TypeScript API for Render
- `kokoro-service/` — FastAPI Kokoro 82M inference service for Render

## What It Does

- Large text editor with copy, clear, and cleanup actions
- Automatic language detection with subtle manual override
- Curated voice cards instead of raw provider IDs
- Emotion selector that shapes the generation request
- Advanced settings for speed, pitch, pauses, and delivery
- Native browser audio playback for reliable listening
- Downloadable audio output
- Recent history without any account or workspace concepts
- Rate limiting, validation, logging, and env validation on the backend

## Product Direction

- Public and login-free
- Light and dark themes
- Desktop-first, but responsive
- Minimal layout with a centered hero and one main card
- No paywall, no sidebar, no workspace UI, no auth prompts

## Stack

### Frontend

- Next.js 14 App Router
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- Zod
- Pino
- `sql.js` for file-backed history storage

### Inference Service

- FastAPI
- Kokoro 82M
- `misaki[en]`
- `soundfile`
- Docker for Render deployment

## Storage

VoiceForge already stores generated history and audio files.

- History is stored in a file-backed `sql.js` database
- Audio files are stored on disk and served through the backend
- In local development this lives under `backend/data/` and `backend/storage/audio/`
- In production, the included [render.yaml](/c:/Users/kotnala/Desktop/TTS/render.yaml) mounts a persistent Render disk at `/var/data`, so history and audio survive restarts

## Folder Structure

```text
VoiceForge/
|-- frontend/
|-- backend/
|-- kokoro-service/
|-- render.yaml
|-- package.json
`-- README.md
```

## Local Setup

### 1. Install frontend and backend dependencies

```bash
npm --prefix frontend install
npm --prefix backend install
```

### 2. Create environment files

```bash
cd frontend
cp .env.example .env.local

cd ../backend
cp .env.example .env

cd ../kokoro-service
cp .env.example .env
```

### 3. Start the Kokoro service

This service powers the real speech generation.

```bash
cd kokoro-service
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If you do not have the Kokoro dependencies available yet, you can temporarily set `TTS_PROVIDER=mock` in `backend/.env` to verify the UI and API flow with generated WAV test tones.

### 4. Start the backend

```bash
cd backend
npm run dev
```

Default backend URL:

```text
http://localhost:4000
```

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

Default frontend URL:

```text
http://localhost:3000
```

## Environment Variables

### Frontend

File: `frontend/.env.example`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Backend

File: `backend/.env.example`

```env
NODE_ENV=development
PORT=4000
LOG_LEVEL=info
TTS_PROVIDER=kokoro
KOKORO_SERVICE_URL=http://localhost:8000
KOKORO_SERVICE_API_KEY=change-me
KOKORO_SERVICE_TIMEOUT_MS=60000
CORS_ORIGINS=http://localhost:3000
BACKEND_BASE_URL=http://localhost:4000
REQUEST_BODY_LIMIT=32kb
DATABASE_PATH=./data/voiceforge.db
AUDIO_STORAGE_PATH=./storage/audio
MAX_TEXT_LENGTH=3200
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=12
```

### Kokoro Service

File: `kokoro-service/.env.example`

```env
KOKORO_SERVICE_API_KEY=change-me
KOKORO_MAX_TEXT_LENGTH=3200
KOKORO_CACHE_ITEMS=16
```

## API Endpoints

### `GET /health`

Returns backend health and provider status.

### `GET /api/tts/voices`

Returns:

- provider name
- capabilities
- defaults
- curated voice presets
- emotion options

### `POST /api/tts/analyze`

Request:

```json
{
  "text": "Hello team, thanks for checking this update."
}
```

Response:

```json
{
  "detectedLanguage": {
    "code": "en-IN",
    "label": "English",
    "baseLanguage": "en",
    "confidence": "medium",
    "needsReview": false,
    "source": "keywords"
  },
  "suggestedEmotion": "friendly",
  "recommendedVoiceId": "en-IN-natural"
}
```

### `POST /api/tts/generate`

Request:

```json
{
  "text": "Hello team, thanks for checking this update.",
  "voice": "en-IN-natural",
  "language": "en-IN",
  "emotion": "friendly",
  "speed": 1,
  "pitch": 0,
  "pauses": 1,
  "expressiveness": 0.5
}
```

Returns a stored history record with:

- `audioUrl`
- resolved voice and language
- status
- provider metadata

### `GET /api/history`

Returns recent generations for the public session view.

## Commands

From the repo root:

```bash
npm run lint
npm run test
npm run build
```

Or per app:

```bash
cd backend
npm run lint
npm run test
npm run build

cd ../frontend
npm run lint
npm run test
npm run build
```

## Deploy to Vercel and Render

### Frontend → Vercel

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Set the project Root Directory to `frontend`.
4. Add:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
```

5. Deploy.

### Kokoro Service → Render

1. Create a new Render Web Service from this repo.
2. Set:
   - Root Directory: `kokoro-service`
   - Runtime: `Docker`
   - Health Check Path: `/health`
3. Add:

```env
KOKORO_SERVICE_API_KEY=change-me
KOKORO_MAX_TEXT_LENGTH=3200
KOKORO_CACHE_ITEMS=16
```

4. Deploy and note the public service URL.

### Backend → Render

1. Create a new Render Web Service from this repo.
2. Set:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Health Check Path: `/health`
3. Add:

```env
NODE_ENV=production
LOG_LEVEL=info
TTS_PROVIDER=kokoro
KOKORO_SERVICE_URL=https://your-kokoro-service.onrender.com
KOKORO_SERVICE_API_KEY=change-me
KOKORO_SERVICE_TIMEOUT_MS=60000
BACKEND_BASE_URL=https://your-backend.onrender.com
CORS_ORIGINS=https://your-frontend.vercel.app
REQUEST_BODY_LIMIT=32kb
DATABASE_PATH=/var/data/voiceforge.db
AUDIO_STORAGE_PATH=/var/data/audio
MAX_TEXT_LENGTH=3200
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=12
```

5. Deploy.

### Render Blueprint

A starter blueprint is included at [render.yaml](/c:/Users/kotnala/Desktop/TTS/render.yaml).

## Production Checks

After deployment, verify:

1. `GET /health` on the backend returns `ok`.
2. `GET /health` on the Kokoro service returns `ok`.
3. `GET /api/tts/voices` returns the curated presets.
4. Typing text updates the detected language.
5. Emotion and advanced settings change the generated output metadata.
6. Audio plays in the browser audio player and downloads correctly.
7. No auth or login UI appears anywhere.
8. No provider secrets are visible in the browser.

## Notes

- The app is public by design. There is no auth layer, no workspace model, and no account requirement.
- The backend keeps provider communication isolated behind `backend/src/services/ttsProvider.ts`.
- The Kokoro voice layer is intentionally curated so the public UI shows a small set of practical voice choices.
- If the Kokoro service is unavailable, the backend can still run with `TTS_PROVIDER=mock` for smoke testing.
