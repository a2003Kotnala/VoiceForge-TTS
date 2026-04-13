from __future__ import annotations

import hashlib
import io
import os
import re
import time
from collections import OrderedDict
from dataclasses import dataclass
from functools import lru_cache
from threading import Event, Lock, Thread
from typing import Literal

import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse, Response
from huggingface_hub import hf_hub_download
from kokoro import KPipeline
from pydantic import BaseModel, Field, field_validator

SAMPLE_RATE = 24000
MAX_TEXT_LENGTH = int(os.getenv("KOKORO_MAX_TEXT_LENGTH", "3200"))
SERVICE_API_KEY = os.getenv("KOKORO_SERVICE_API_KEY")
VOICE_REPO_ID = os.getenv("KOKORO_VOICE_REPO_ID", "hexgrad/Kokoro-82M")
CACHE_LIMIT = int(os.getenv("KOKORO_CACHE_ITEMS", "16"))
INFLIGHT_WAIT_SECONDS = float(os.getenv("KOKORO_INFLIGHT_WAIT_SECONDS", "90"))
PREWARM_ENABLED = os.getenv("KOKORO_PREWARM", "1").strip().lower() not in {
    "0",
    "false",
    "no",
}
PREWARM_PRESET_IDS = tuple(
    preset_id.strip()
    for preset_id in os.getenv("KOKORO_PREWARM_PRESET_IDS", "").split(",")
    if preset_id.strip()
)
TORCH_THREADS = int(os.getenv("KOKORO_TORCH_THREADS", "0"))

if TORCH_THREADS > 0:
    torch.set_num_threads(TORCH_THREADS)


@dataclass(frozen=True)
class VoicePreset:
    id: str
    name: str
    display_name: str
    description: str
    presentation: str
    accent_label: str
    languages: tuple[str, ...]
    lang_code: str
    voices: tuple[tuple[str, float], ...]
    sort_order: int
    recommended: bool = False


VOICE_PRESETS: tuple[VoicePreset, ...] = (
    VoicePreset(
        id="en-IN-natural",
        name="en-IN-natural",
        display_name="Indian English - Natural",
        description=(
            "Balanced for notes, scripts, and everyday listening, with an "
            "Indian-English-oriented voice blend."
        ),
        presentation="Everyday",
        accent_label="English (India)",
        languages=("en-IN",),
        lang_code="b",
        voices=(("bf_emma", 0.72), ("hf_beta", 0.28)),
        sort_order=1,
        recommended=True,
    ),
    VoicePreset(
        id="en-IN-clear",
        name="en-IN-clear",
        display_name="Indian English - Clear",
        description="Steadier delivery for explainers, updates, and meeting notes.",
        presentation="Clear",
        accent_label="English (India)",
        languages=("en-IN",),
        lang_code="b",
        voices=(("bf_emma", 0.82), ("hf_alpha", 0.18)),
        sort_order=2,
    ),
    VoicePreset(
        id="en-IN-story",
        name="en-IN-story",
        display_name="Indian English - Storytelling",
        description="Softer phrasing and slightly more lift for narrative passages.",
        presentation="Narrative",
        accent_label="English (India)",
        languages=("en-IN",),
        lang_code="b",
        voices=(("af_bella", 0.42), ("bf_emma", 0.38), ("hf_beta", 0.2)),
        sort_order=3,
    ),
    VoicePreset(
        id="hi-IN-natural",
        name="hi-IN-natural",
        display_name="Hindi - Natural",
        description="Conversational Hindi delivery for everyday speech.",
        presentation="Conversational",
        accent_label="Hindi (India)",
        languages=("hi-IN",),
        lang_code="h",
        voices=(("hf_alpha", 0.65), ("hf_beta", 0.35)),
        sort_order=4,
        recommended=True,
    ),
    VoicePreset(
        id="en-GB-clear",
        name="en-GB-clear",
        display_name="British English - Clear",
        description="A dependable British English fallback for clean narration.",
        presentation="Clear",
        accent_label="English (United Kingdom)",
        languages=("en-GB",),
        lang_code="b",
        voices=(("bf_emma", 1.0),),
        sort_order=5,
    ),
    VoicePreset(
        id="en-US-clear",
        name="en-US-clear",
        display_name="American English - Clear",
        description="A neutral fallback for American English copy.",
        presentation="Clear",
        accent_label="English (United States)",
        languages=("en-US",),
        lang_code="a",
        voices=(("af_bella", 1.0),),
        sort_order=6,
    ),
    VoicePreset(
        id="es-ES-natural",
        name="es-ES-natural",
        display_name="Spanish - Natural",
        description="Everyday Spanish with a steady delivery.",
        presentation="Everyday",
        accent_label="Spanish (Spain)",
        languages=("es-ES",),
        lang_code="e",
        voices=(("ef_dora", 1.0),),
        sort_order=7,
    ),
    VoicePreset(
        id="fr-FR-natural",
        name="fr-FR-natural",
        display_name="French - Natural",
        description="A simple French preset for short everyday passages.",
        presentation="Everyday",
        accent_label="French (France)",
        languages=("fr-FR",),
        lang_code="f",
        voices=(("ff_siwis", 1.0),),
        sort_order=8,
    ),
    VoicePreset(
        id="it-IT-natural",
        name="it-IT-natural",
        display_name="Italian - Natural",
        description="A simple Italian preset for short everyday passages.",
        presentation="Everyday",
        accent_label="Italian (Italy)",
        languages=("it-IT",),
        lang_code="i",
        voices=(("if_sara", 1.0),),
        sort_order=9,
    ),
    VoicePreset(
        id="pt-BR-natural",
        name="pt-BR-natural",
        display_name="Portuguese - Natural",
        description="A simple Portuguese preset for short everyday passages.",
        presentation="Everyday",
        accent_label="Portuguese (Brazil)",
        languages=("pt-BR",),
        lang_code="p",
        voices=(("pf_dora", 1.0),),
        sort_order=10,
    ),
)

VOICE_PRESET_MAP = {preset.id: preset for preset in VOICE_PRESETS}

EMOTION_PRESETS = {
    "neutral": {"speed": 1.0, "pitch": 0.0, "pause_ms": 160, "expressiveness": 0.45},
    "calm": {"speed": 0.92, "pitch": -0.25, "pause_ms": 260, "expressiveness": 0.28},
    "friendly": {"speed": 1.0, "pitch": 0.1, "pause_ms": 190, "expressiveness": 0.56},
    "professional": {"speed": 0.97, "pitch": -0.1, "pause_ms": 180, "expressiveness": 0.3},
    "serious": {"speed": 0.94, "pitch": -0.25, "pause_ms": 240, "expressiveness": 0.24},
    "cheerful": {"speed": 1.05, "pitch": 0.22, "pause_ms": 150, "expressiveness": 0.7},
    "sad": {"speed": 0.9, "pitch": -0.35, "pause_ms": 300, "expressiveness": 0.42},
    "angry": {"speed": 1.06, "pitch": 0.1, "pause_ms": 130, "expressiveness": 0.76},
    "excited": {"speed": 1.08, "pitch": 0.35, "pause_ms": 120, "expressiveness": 0.84},
    "storytelling": {"speed": 0.96, "pitch": 0.12, "pause_ms": 320, "expressiveness": 0.74},
}


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT_LENGTH)
    emotion: Literal[
        "neutral",
        "calm",
        "friendly",
        "professional",
        "serious",
        "cheerful",
        "sad",
        "angry",
        "excited",
        "storytelling",
    ]
    voice_id: str | None = None
    language: str | None = None
    speed: float = Field(default=1.0, ge=0.8, le=1.2)
    pitch: float = Field(default=0.0, ge=-2.0, le=2.0)
    expressiveness: float = Field(default=0.5, ge=0.0, le=1.0)
    pauses: float = Field(default=1.0, ge=0.7, le=1.4)
    request_id: str | None = None

    @field_validator("text")
    @classmethod
    def sanitize_text(cls, value: str) -> str:
        cleaned = (
            value.replace("\r\n", "\n")
            .replace("\u00a0", " ")
            .strip()
        )
        cleaned = re.sub(r"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]", "", cleaned)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        if not cleaned:
            raise ValueError("Text must contain at least one visible character.")

        return cleaned


class VoiceResponse(BaseModel):
    id: str
    name: str
    displayName: str
    description: str
    presentation: str
    accentLabel: str
    languages: list[str]
    provider: str
    quality: str
    recommended: bool
    sortOrder: int


@dataclass
class PendingSynthesis:
    event: Event
    status_code: int | None = None
    detail: str | None = None


@dataclass
class WarmupSnapshot:
    status: str = "idle"
    detail: str | None = None
    started_at: float | None = None
    completed_at: float | None = None


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(max(value, minimum), maximum)


def ensure_authorized(service_key: str | None) -> None:
    if SERVICE_API_KEY and service_key != SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid service key.")


def split_long_sentence(sentence: str, max_chars: int) -> list[str]:
    if len(sentence) <= max_chars:
        return [sentence]

    pieces: list[str] = []
    current = ""

    for token in sentence.split(" "):
        token = token.strip()
        if not token:
            continue

        candidate = f"{current} {token}".strip()
        if len(candidate) <= max_chars:
            current = candidate
            continue

        if current:
            pieces.append(current)
        current = token

    if current:
        pieces.append(current)

    return pieces


def segment_text(text: str, max_chars: int) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n+", text) if part.strip()]
    segments: list[str] = []

    for paragraph in paragraphs:
        sentences = re.split(r"(?<=[.!?])\s+", paragraph)
        current = ""

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            candidate = f"{current} {sentence}".strip()
            if len(candidate) <= max_chars:
                current = candidate
                continue

            if current:
                segments.append(current)
                current = ""

            segments.extend(split_long_sentence(sentence, max_chars))

        if current:
            segments.append(current)

    return segments or [text]


def select_preset(language: str | None, voice_id: str | None) -> VoicePreset:
    if voice_id:
        preset = VOICE_PRESET_MAP.get(voice_id)
        if not preset:
            raise HTTPException(status_code=400, detail="Voice preset was not found.")
        return preset

    if language:
        matching = [
            preset for preset in VOICE_PRESETS if language in preset.languages
        ]
        if matching:
            return next((preset for preset in matching if preset.recommended), matching[0])

    return VOICE_PRESET_MAP["en-IN-natural"]


@lru_cache(maxsize=8)
def get_pipeline(lang_code: str) -> KPipeline:
    return KPipeline(lang_code=lang_code)


@lru_cache(maxsize=32)
def load_voice_tensor(voice_name: str):
    voice_path = hf_hub_download(
        repo_id=VOICE_REPO_ID,
        filename=f"voices/{voice_name}.pt",
    )
    try:
        tensor = torch.load(voice_path, map_location="cpu", weights_only=True)
    except TypeError:
        tensor = torch.load(voice_path, map_location="cpu")

    return tensor.float()


@lru_cache(maxsize=32)
def build_preset_voice_tensor(preset_id: str):
    preset = VOICE_PRESET_MAP[preset_id]
    tensor = None
    total_weight = 0.0

    for voice_name, weight in preset.voices:
        voice_tensor = load_voice_tensor(voice_name)
        tensor = voice_tensor * weight if tensor is None else tensor + voice_tensor * weight
        total_weight += weight

    if tensor is None or total_weight <= 0:
        raise RuntimeError(f"Unable to build voice tensor for preset {preset_id}.")

    return tensor / total_weight


def build_style(
    emotion: str, speed: float, pitch: float, expressiveness: float, pauses: float
):
    preset = EMOTION_PRESETS[emotion]
    resolved_expressiveness = clamp(
        expressiveness * 0.65 + preset["expressiveness"] * 0.35,
        0.0,
        1.0,
    )
    resolved_speed = clamp(speed * preset["speed"], 0.8, 1.2)
    resolved_pitch = clamp(
        pitch + preset["pitch"] + (resolved_expressiveness - 0.5) * 0.25,
        -2.0,
        2.0,
    )
    pause_ms = int(
        preset["pause_ms"] * pauses * (0.9 + resolved_expressiveness * 0.25)
    )
    segment_chars = int(300 - resolved_expressiveness * 60)

    return {
        "speed": resolved_speed,
        "pitch": resolved_pitch,
        "expressiveness": resolved_expressiveness,
        "pause_ms": pause_ms,
        "segment_chars": max(segment_chars, 190),
    }


def pitch_shift_audio(audio: np.ndarray, semitones: float) -> np.ndarray:
    if abs(semitones) < 0.05 or len(audio) < 4:
        return audio.astype(np.float32)

    factor = 2 ** (semitones / 12.0)
    source_positions = np.arange(len(audio), dtype=np.float32)
    shifted_positions = np.arange(0, len(audio), factor, dtype=np.float32)
    shifted = np.interp(shifted_positions, source_positions, audio).astype(np.float32)
    target_positions = np.linspace(0, len(shifted) - 1, num=len(audio), dtype=np.float32)

    return np.interp(target_positions, np.arange(len(shifted), dtype=np.float32), shifted).astype(np.float32)


def normalize_audio_part(audio: np.ndarray | list[float]) -> np.ndarray | None:
    part = np.asarray(audio, dtype=np.float32).reshape(-1)

    if part.size == 0:
        return None

    return np.nan_to_num(part, copy=False)


def pause_for_segment(segment: str, base_pause_ms: int, expressiveness: float) -> np.ndarray:
    extra_pause = 0
    if segment.endswith("?"):
        extra_pause = 90
    elif segment.endswith("!"):
        extra_pause = 70
    elif segment.endswith("."):
        extra_pause = 40

    total_pause_ms = int(base_pause_ms + extra_pause * (0.65 + expressiveness * 0.35))
    pause_samples = max(int((total_pause_ms / 1000) * SAMPLE_RATE), 1)

    return np.zeros(pause_samples, dtype=np.float32)


def build_cache_key(
    request: SynthesizeRequest, preset: VoicePreset, style: dict[str, float | int]
) -> str:
    payload = "|".join(
        [
        request.text,
        request.emotion,
        preset.id,
        request.language or "",
        f"{style['speed']:.4f}",
        f"{style['pitch']:.4f}",
        f"{style['expressiveness']:.4f}",
        f"{request.pauses:.4f}",
    ]
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class AudioCache:
    def __init__(self, max_items: int) -> None:
        self.max_items = max_items
        self.store: OrderedDict[str, tuple[bytes, dict[str, str]]] = OrderedDict()
        self.lock = Lock()

    def get(self, key: str) -> tuple[bytes, dict[str, str]] | None:
        with self.lock:
            value = self.store.get(key)
            if value is None:
                return None
            self.store.move_to_end(key)
            return value

    def set(self, key: str, audio_bytes: bytes, headers: dict[str, str]) -> None:
        with self.lock:
            self.store[key] = (audio_bytes, headers)
            self.store.move_to_end(key)

            while len(self.store) > self.max_items:
                self.store.popitem(last=False)

    def size(self) -> int:
        with self.lock:
            return len(self.store)


class SynthesisCoordinator:
    def __init__(self, wait_seconds: float) -> None:
        self.wait_seconds = wait_seconds
        self.pending: dict[str, PendingSynthesis] = {}
        self.lock = Lock()

    def reserve(self, key: str) -> tuple[bool, PendingSynthesis]:
        with self.lock:
            existing = self.pending.get(key)
            if existing is not None:
                return False, existing

            pending = PendingSynthesis(event=Event())
            self.pending[key] = pending
            return True, pending

    def await_existing(self, key: str, pending: PendingSynthesis) -> tuple[bytes, dict[str, str]]:
        if not pending.event.wait(self.wait_seconds):
            raise HTTPException(
                status_code=504,
                detail="Timed out while waiting for an in-flight Kokoro synthesis.",
            )

        if pending.detail is not None:
            raise HTTPException(
                status_code=pending.status_code or 500,
                detail=pending.detail,
            )

        cached = audio_cache.get(key)
        if cached is None:
            raise HTTPException(
                status_code=503,
                detail="Kokoro finished but the shared audio result was unavailable.",
            )

        return cached

    def resolve(self, key: str, *, status_code: int | None = None, detail: str | None = None) -> None:
        with self.lock:
            pending = self.pending.pop(key, None)

        if pending is not None:
            pending.status_code = status_code
            pending.detail = detail
            pending.event.set()

    def size(self) -> int:
        with self.lock:
            return len(self.pending)


audio_cache = AudioCache(CACHE_LIMIT)
synthesis_coordinator = SynthesisCoordinator(INFLIGHT_WAIT_SECONDS)
warmup_snapshot = WarmupSnapshot()
warmup_lock = Lock()
app = FastAPI(title="VoiceForge Kokoro Service", version="1.0.0")


def set_warmup_snapshot(status: str, detail: str | None = None) -> None:
    now = time.time()

    with warmup_lock:
        if status == "warming":
            warmup_snapshot.started_at = now
            warmup_snapshot.completed_at = None
        elif status in {"ready", "failed", "disabled"}:
            warmup_snapshot.completed_at = now
            if warmup_snapshot.started_at is None:
                warmup_snapshot.started_at = now

        warmup_snapshot.status = status
        warmup_snapshot.detail = detail


def get_warmup_snapshot() -> WarmupSnapshot:
    with warmup_lock:
        return WarmupSnapshot(
            status=warmup_snapshot.status,
            detail=warmup_snapshot.detail,
            started_at=warmup_snapshot.started_at,
            completed_at=warmup_snapshot.completed_at,
        )


def get_prewarm_preset_ids() -> tuple[str, ...]:
    if PREWARM_PRESET_IDS:
        preset_ids = tuple(
            preset_id for preset_id in PREWARM_PRESET_IDS if preset_id in VOICE_PRESET_MAP
        )
        if preset_ids:
            return preset_ids

    defaults = ("en-IN-natural", "hi-IN-natural", "en-US-clear")
    return tuple(preset_id for preset_id in defaults if preset_id in VOICE_PRESET_MAP)


def prewarm_models() -> None:
    if not PREWARM_ENABLED:
        set_warmup_snapshot("disabled", "Prewarm is disabled.")
        return

    preset_ids = get_prewarm_preset_ids()
    if not preset_ids:
        set_warmup_snapshot("disabled", "No valid prewarm presets were configured.")
        return

    set_warmup_snapshot("warming", f"Preparing {len(preset_ids)} Kokoro preset(s).")

    try:
        for preset_id in preset_ids:
            preset = VOICE_PRESET_MAP[preset_id]
            get_pipeline(preset.lang_code)
            build_preset_voice_tensor(preset_id)

        set_warmup_snapshot(
            "ready",
            f"Prepared {len(preset_ids)} preset(s): {', '.join(preset_ids)}.",
        )
    except Exception as error:
        set_warmup_snapshot("failed", str(error))


@app.on_event("startup")
def start_prewarm_thread() -> None:
    if not PREWARM_ENABLED:
        set_warmup_snapshot("disabled", "Prewarm is disabled.")
        return

    Thread(target=prewarm_models, name="kokoro-prewarm", daemon=True).start()


@app.get("/health")
def health() -> JSONResponse:
    warmup = get_warmup_snapshot()

    return JSONResponse(
        {
            "status": "degraded" if warmup.status == "failed" else "ok",
            "service": "voiceforge-kokoro",
            "model": "Kokoro-82M",
            "voiceCount": len(VOICE_PRESETS),
            "warmup": {
                "status": warmup.status,
                "detail": warmup.detail,
                "startedAt": warmup.started_at,
                "completedAt": warmup.completed_at,
            },
            "cache": {
                "audioItems": audio_cache.size(),
                "pipelines": get_pipeline.cache_info().currsize,
                "baseVoices": load_voice_tensor.cache_info().currsize,
                "voiceMixes": build_preset_voice_tensor.cache_info().currsize,
                "pendingSynthesis": synthesis_coordinator.size(),
            },
        }
    )


@app.get("/voices")
def list_voices(x_service_key: str | None = Header(default=None)) -> JSONResponse:
    ensure_authorized(x_service_key)

    payload = [
        VoiceResponse(
            id=preset.id,
            name=preset.name,
            displayName=preset.display_name,
            description=preset.description,
            presentation=preset.presentation,
            accentLabel=preset.accent_label,
            languages=list(preset.languages),
            provider="kokoro",
            quality="Kokoro 82M",
            recommended=preset.recommended,
            sortOrder=preset.sort_order,
        ).model_dump()
        for preset in VOICE_PRESETS
    ]

    return JSONResponse(
        {
            "provider": "kokoro",
            "model": "Kokoro-82M",
            "voices": payload,
        }
    )


@app.post("/synthesize")
def synthesize(
    request: SynthesizeRequest, x_service_key: str | None = Header(default=None)
) -> Response:
    ensure_authorized(x_service_key)

    preset = select_preset(request.language, request.voice_id)
    if request.language and request.language not in preset.languages:
        raise HTTPException(
            status_code=400,
            detail="The selected voice preset does not support that language.",
        )

    style = build_style(
        request.emotion,
        request.speed,
        request.pitch,
        request.expressiveness,
        request.pauses,
    )
    cache_key = build_cache_key(request, preset, style)
    cached = audio_cache.get(cache_key)

    if cached:
        audio_bytes, headers = cached
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={**headers, "x-kokoro-cache-hit": "1"},
        )

    is_owner, pending = synthesis_coordinator.reserve(cache_key)
    if not is_owner:
        audio_bytes, headers = synthesis_coordinator.await_existing(cache_key, pending)
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                **headers,
                "x-kokoro-cache-hit": "1",
                "x-kokoro-deduped": "1",
            },
        )

    try:
        pipeline = get_pipeline(preset.lang_code)
        voice_tensor = build_preset_voice_tensor(preset.id)
        segments = segment_text(request.text, int(style["segment_chars"]))
        audio_parts: list[np.ndarray] = []

        try:
            with torch.inference_mode():
                for segment in segments:
                    for _, _, audio in pipeline(
                        segment,
                        voice=voice_tensor,
                        speed=float(style["speed"]),
                        split_pattern=r"\n+",
                    ):
                        part = normalize_audio_part(audio)
                        if part is not None:
                            audio_parts.append(part)

                    audio_parts.append(
                        pause_for_segment(
                            segment,
                            int(style["pause_ms"]),
                            float(style["expressiveness"]),
                        )
                    )
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail="Kokoro synthesis failed during inference.",
            ) from error

        if not audio_parts:
            raise HTTPException(status_code=500, detail="Kokoro returned no audio.")

        combined = np.concatenate(audio_parts[:-1] or audio_parts)
        combined = pitch_shift_audio(combined, float(style["pitch"]))
        combined = np.clip(combined, -1.0, 1.0).astype(np.float32)

        buffer = io.BytesIO()
        sf.write(buffer, combined, SAMPLE_RATE, format="WAV")
        audio_bytes = buffer.getvalue()

        headers = {
            "x-kokoro-model": "Kokoro-82M",
            "x-kokoro-voice-id": preset.id,
            "x-kokoro-voice-label": preset.display_name,
            "x-kokoro-language": request.language or preset.languages[0],
            "x-kokoro-speed": f"{float(style['speed']):.3f}",
            "x-kokoro-pitch": f"{float(style['pitch']):.3f}",
            "x-kokoro-expressiveness": f"{float(style['expressiveness']):.3f}",
            "x-kokoro-pauses": f"{float(request.pauses):.3f}",
            "x-kokoro-cache-hit": "0",
            "x-kokoro-deduped": "0",
        }

        audio_cache.set(cache_key, audio_bytes, headers)
        synthesis_coordinator.resolve(cache_key)

        return Response(content=audio_bytes, media_type="audio/wav", headers=headers)
    except HTTPException as error:
        synthesis_coordinator.resolve(
            cache_key,
            status_code=error.status_code,
            detail=str(error.detail),
        )
        raise
    except Exception as error:
        synthesis_coordinator.resolve(
            cache_key,
            status_code=500,
            detail="Kokoro synthesis failed unexpectedly.",
        )
        raise HTTPException(
            status_code=500,
            detail="Kokoro synthesis failed unexpectedly.",
        ) from error
