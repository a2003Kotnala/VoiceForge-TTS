# VoiceForge

VoiceForge is a production-ready text-to-speech monorepo with:

- `frontend/`: Next.js 14 App Router UI for text input, voice controls, playback, downloads, and history
- `backend/`: Express + TypeScript API with provider abstraction, Google Cloud TTS integration, rate limiting, history persistence, and health checks

## Features

- Type or paste text and track character limits before submission
- Select language/accent and voice from the backend provider
- Adjust speed, pitch, and volume when the provider supports them
- Generate speech server-side and play it back in the browser
- Download the generated audio file
- View recent generation history with clear statuses
- Provider abstraction for easy provider switching
- Centralized validation, error handling, logging, request size limits, and rate limiting
- SQLite-compatible history storage via `sql.js`, persisted to disk
- Deployable split setup for Vercel frontend + Render backend

## Tech Stack

### Frontend

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Sonner for toasts

### Backend

- Node.js
- Express
- TypeScript
- Zod
- Pino
- `@google-cloud/text-to-speech`
- `sql.js` for persisted SQLite-style history storage

## Folder Structure

```text
VoiceForge/
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ components/
│  │  └─ lib/
│  ├─ .env.example
│  └─ package.json
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ db/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  ├─ services/
│  │  └─ utils/
│  ├─ storage/audio/
│  ├─ tests/
│  ├─ .env.example
│  └─ package.json
├─ .gitignore
├─ package.json
└─ README.md
```

## Local Setup

### 1. Install dependencies

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 2. Create environment files

```bash
cd frontend
cp .env.example .env.local

cd ../backend
cp .env.example .env
```

### 3. Configure the backend

For real speech generation, set these backend env vars:

- `TTS_PROVIDER=google`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_CREDENTIALS_JSON`

For local UI smoke tests without cloud credentials, you can temporarily use:

- `TTS_PROVIDER=mock`

Important:

- `mock` is only for local flow verification and returns a generated tone, not real speech.
- Keep provider secrets only in `backend/.env` or Render environment variables.

### 4. Start the backend

```bash
cd backend
npm run dev
```

The API defaults to `http://localhost:4000`.

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

The app defaults to `http://localhost:3000`.

## Environment Variables

### Frontend

`frontend/.env.example`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Backend

`backend/.env.example`

```env
NODE_ENV=development
PORT=4000
LOG_LEVEL=info
TTS_PROVIDER=google
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"your-gcp-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"voiceforge@your-gcp-project-id.iam.gserviceaccount.com","client_id":"1234567890","token_uri":"https://oauth2.googleapis.com/token"}
CORS_ORIGINS=http://localhost:3000
BACKEND_BASE_URL=http://localhost:4000
REQUEST_BODY_LIMIT=32kb
DATABASE_PATH=./data/voiceforge.db
AUDIO_STORAGE_PATH=./storage/audio
MAX_TEXT_LENGTH=4500
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=12
```

## Backend API

### `GET /health`

Returns:

```json
{
  "status": "ok",
  "service": "voiceforge-backend",
  "provider": "google",
  "providerConfigured": true
}
```

### `GET /api/tts/voices`

Returns the active provider, capabilities, max text length, and available voices.

### `POST /api/tts/generate`

Accepts:

```json
{
  "text": "Hello from VoiceForge",
  "voice": "en-US-Neural2-D",
  "language": "en-US",
  "speed": 1,
  "pitch": 0,
  "volume": 0
}
```

Returns the stored history record, including the generated audio URL.

### `GET /api/history`

Returns recent history entries.

## Tests And Build Commands

### Frontend

```bash
cd frontend
npm run lint
npm run test
npm run build
```

### Backend

```bash
cd backend
npm run lint
npm run test
npm run build
```

## GitHub Repo Setup

From the project root:

```bash
git init
git add .
git commit -m "Initial VoiceForge release"
git branch -M main
gh repo create voiceforge --private --source . --remote origin --push
```

If you prefer the GitHub web UI:

1. Create an empty repository.
2. Copy its remote URL.
3. Run:

```bash
git init
git add .
git commit -m "Initial VoiceForge release"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Deploy Frontend To Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repository.
3. Set the **Root Directory** to `frontend`.
4. Keep the default Next.js build settings.
5. Add:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com
```

6. Deploy.

After the first successful backend deployment, update the Vercel env var to the real Render URL if needed and redeploy.

## Deploy Backend To Render

1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Set:

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/health`

4. Use Node 20+.
5. Attach a **Persistent Disk** mounted at `/var/data`.
6. Add these environment variables:

```env
NODE_ENV=production
PORT=10000
LOG_LEVEL=info
TTS_PROVIDER=google
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"your-gcp-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"voiceforge@your-gcp-project-id.iam.gserviceaccount.com","client_id":"1234567890","token_uri":"https://oauth2.googleapis.com/token"}
BACKEND_BASE_URL=https://your-render-service.onrender.com
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
REQUEST_BODY_LIMIT=32kb
DATABASE_PATH=/var/data/voiceforge.db
AUDIO_STORAGE_PATH=/var/data/audio
MAX_TEXT_LENGTH=4500
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=12
```

7. Deploy the service.

If you use Vercel preview deployments and want them to hit Render, you can optionally add a wildcard origin such as `https://*.vercel.app` to `CORS_ORIGINS`.

## Production Checks

After deployment, verify:

1. `GET https://your-render-service.onrender.com/health` returns `ok` or `degraded` with a valid JSON payload.
2. `GET /api/tts/voices` returns voices from the configured provider.
3. The Vercel app can submit a generation request without CORS failures.
4. Generated audio plays in the browser and downloads successfully.
5. History persists across backend restarts because the Render disk is mounted.
6. No provider keys appear in browser devtools or frontend source code.

## Troubleshooting

### The frontend says it cannot reach the backend

- Confirm `NEXT_PUBLIC_API_BASE_URL` points to the Render backend URL.
- Confirm the Render service is healthy at `/health`.
- Confirm the backend `CORS_ORIGINS` includes your Vercel domain.

### `/api/tts/voices` returns a 503

- Verify `TTS_PROVIDER=google`
- Verify `GOOGLE_CLOUD_PROJECT_ID`
- Verify `GOOGLE_CLOUD_CREDENTIALS_JSON`
- Confirm the service account has access to Google Cloud Text-to-Speech

### Audio does not persist on Render

- Confirm you attached a persistent disk.
- Confirm `DATABASE_PATH` and `AUDIO_STORAGE_PATH` point into the mounted disk path.

### The app works locally but not on Vercel

- Confirm the Vercel project root is `frontend`.
- Confirm `NEXT_PUBLIC_API_BASE_URL` uses the public Render URL, not `localhost`.

## Notes

- The backend uses a provider abstraction in `backend/src/services/ttsProvider.ts`.
- The shipped real provider is Google Cloud TTS because it supports voice listing plus speed, pitch, and volume controls.
- The backend health endpoint will still start even if Google credentials are missing; the TTS routes return a clear `503` until provider env vars are configured.
