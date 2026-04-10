"use client";

import type { ChangeEvent } from "react";
import { Sparkles } from "lucide-react";

import type { TtsCapabilities, VoiceOption } from "@/lib/types";
import { cn, getCharacterState } from "@/lib/utils";

import { SectionCard } from "./ui/SectionCard";

type LanguageOption = {
  code: string;
  label: string;
};

type TTSFormProps = {
  text: string;
  selectedVoice: string;
  selectedLanguage: string;
  voices: VoiceOption[];
  languages: LanguageOption[];
  capabilities: TtsCapabilities;
  providerName: string;
  maxTextLength: number;
  speed: number;
  pitch: number;
  volume: number;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onTextChange: (value: string) => void;
  onVoiceChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onSpeedChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onSubmit: () => void;
};

type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueLabel: string;
  onChange: (value: number) => void;
};

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  valueLabel,
  onChange
}: SliderControlProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <label className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
          {valueLabel}
        </span>
      </div>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-teal-400"
        max={max}
        min={min}
        onChange={handleChange}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

export function TTSForm({
  text,
  selectedVoice,
  selectedLanguage,
  voices,
  languages,
  capabilities,
  providerName,
  maxTextLength,
  speed,
  pitch,
  volume,
  isSubmitting,
  errorMessage,
  onTextChange,
  onVoiceChange,
  onLanguageChange,
  onSpeedChange,
  onPitchChange,
  onVolumeChange,
  onSubmit
}: TTSFormProps) {
  const characterState = getCharacterState(text.length, maxTextLength);
  const isTextTooLong = characterState === "error";
  const isSubmitDisabled =
    !text.trim() ||
    !selectedVoice ||
    !selectedLanguage ||
    !voices.length ||
    isTextTooLong ||
    isSubmitting;

  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-200/80">
            TTS Studio
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Craft speech with voice, language, and timing controls
          </h2>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          {providerName}
        </span>
      </div>

      <form
        className="mt-6 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="tts-text">
              Input text
            </label>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                characterState === "normal" && "bg-white/5 text-slate-300",
                characterState === "warning" && "bg-amber-400/10 text-amber-100",
                characterState === "error" && "bg-rose-400/10 text-rose-100"
              )}
            >
              {text.length}/{maxTextLength}
            </span>
          </div>

          <textarea
            className="min-h-40 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-400/20"
            id="tts-text"
            maxLength={maxTextLength + 400}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Type or paste the text you want to turn into speech..."
            value={text}
          />

          <p className="mt-3 text-sm text-slate-400">
            VoiceForge trims unsafe control characters and rejects text beyond the
            provider limit before sending it to the backend.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-3">
            <span className="text-sm font-medium text-slate-200">Language / accent</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300/50 focus:ring-2 focus:ring-teal-400/20"
              onChange={(event) => onLanguageChange(event.target.value)}
              value={selectedLanguage}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-3">
            <span className="text-sm font-medium text-slate-200">Voice</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300/50 focus:ring-2 focus:ring-teal-400/20"
              onChange={(event) => onVoiceChange(event.target.value)}
              value={selectedVoice}
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
          {capabilities.speed ? (
            <SliderControl
              label="Speed"
              max={2}
              min={0.25}
              onChange={onSpeedChange}
              step={0.05}
              value={speed}
              valueLabel={`${speed.toFixed(2)}x`}
            />
          ) : null}
          {capabilities.pitch ? (
            <SliderControl
              label="Pitch"
              max={20}
              min={-20}
              onChange={onPitchChange}
              step={1}
              value={pitch}
              valueLabel={`${pitch.toFixed(0)} st`}
            />
          ) : null}
          {capabilities.volume ? (
            <SliderControl
              label="Volume"
              max={16}
              min={-96}
              onChange={onVolumeChange}
              step={1}
              value={volume}
              valueLabel={`${volume.toFixed(0)} dB`}
            />
          ) : null}
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {isTextTooLong ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            The selected provider supports up to {maxTextLength} characters for a
            single synthesis request.
          </div>
        ) : null}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          disabled={isSubmitDisabled}
          type="submit"
        >
          <Sparkles className="h-4 w-4" />
          {isSubmitting ? "Generating speech..." : "Generate speech"}
        </button>
      </form>
    </SectionCard>
  );
}
