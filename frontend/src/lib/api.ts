import type {
  GenerateSpeechPayload,
  HistoryRecord,
  HistoryResponse,
  TextAnalysisResponse,
  VoicesResponse
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!baseUrl) {
    throw new ApiError(
      "NEXT_PUBLIC_API_BASE_URL is not configured. Add it to frontend/.env.local or Vercel."
    );
  }

  return baseUrl.replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(
        typeof payload === "object" && payload && "error" in payload
          ? String(payload.error)
          : "The request failed.",
        response.status,
        typeof payload === "object" ? payload : undefined
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Unable to reach the VoiceForge backend. Confirm the Render/local API is available and NEXT_PUBLIC_API_BASE_URL is correct."
    );
  }
}

export const api = {
  analyzeText(text: string) {
    return request<TextAnalysisResponse>("/api/tts/analyze", {
      method: "POST",
      body: JSON.stringify({ text })
    });
  },
  getVoices() {
    return request<VoicesResponse>("/api/tts/voices");
  },
  getHistory(limit = 10) {
    return request<HistoryResponse>(`/api/history?limit=${limit}`);
  },
  generateSpeech(payload: GenerateSpeechPayload) {
    return request<HistoryRecord>("/api/tts/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
