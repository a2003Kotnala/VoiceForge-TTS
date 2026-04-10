"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ApiError, api } from "@/lib/api";
import type { HistoryRecord, VoicesResponse } from "@/lib/types";
import { formatLanguageLabel } from "@/lib/utils";

import { AudioPlayer } from "./AudioPlayer";
import { HistoryList } from "./HistoryList";
import { TTSForm } from "./TTSForm";

const DEFAULT_TEXT =
  "Welcome to VoiceForge. This production-ready monorepo generates speech server-side, keeps your recent history, and lets you download polished audio in seconds.";
const EMPTY_VOICES: VoicesResponse["voices"] = [];

export function VoiceForgeShell() {
  const [voicesResponse, setVoicesResponse] = useState<VoicesResponse | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<HistoryRecord | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);

  async function loadInitialData() {
    setIsBootstrapping(true);
    setPageError(null);

    try {
      const [fetchedVoices, fetchedHistory] = await Promise.all([
        api.getVoices(),
        api.getHistory(10)
      ]);

      setVoicesResponse(fetchedVoices);
      setHistory(fetchedHistory.items);
      setActiveRecord((current) => current ?? fetchedHistory.items[0] ?? null);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load VoiceForge.";

      setPageError(message);
      toast.error(message);
    } finally {
      setIsBootstrapping(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  const voices = voicesResponse?.voices ?? EMPTY_VOICES;
  const languageCodes = Array.from(
    new Set(voices.flatMap((voice) => voice.languages))
  );
  const languages = languageCodes.map((code) => ({
    code,
    label: formatLanguageLabel(code)
  }));
  const filteredVoices = selectedLanguage
    ? voices.filter((voice) => voice.languages.includes(selectedLanguage))
    : voices;

  useEffect(() => {
    const nextLanguageCodes = Array.from(
      new Set(voices.map((voice) => voice.languages).flat())
    );

    if (!nextLanguageCodes.length) {
      return;
    }

    if (!nextLanguageCodes.includes(selectedLanguage)) {
      setSelectedLanguage(nextLanguageCodes[0]);
    }
  }, [selectedLanguage, voices]);

  useEffect(() => {
    const nextFilteredVoices = selectedLanguage
      ? voices.filter((voice) => voice.languages.includes(selectedLanguage))
      : voices;

    if (!nextFilteredVoices.length) {
      return;
    }

    if (!nextFilteredVoices.some((voice) => voice.id === selectedVoice)) {
      setSelectedVoice(nextFilteredVoices[0].id);
    }
  }, [selectedLanguage, selectedVoice, voices]);

  async function refreshHistory(preferredActiveId?: string) {
    setIsRefreshingHistory(true);

    try {
      const fetchedHistory = await api.getHistory(10);
      setHistory(fetchedHistory.items);

      if (preferredActiveId) {
        const matchingRecord = fetchedHistory.items.find(
          (item) => item.id === preferredActiveId
        );

        if (matchingRecord) {
          setActiveRecord(matchingRecord);
        }
      }
    } finally {
      setIsRefreshingHistory(false);
    }
  }

  async function handleSubmit() {
    if (!selectedVoice || !selectedLanguage || !text.trim()) {
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    try {
      const record = await api.generateSpeech({
        text,
        voice: selectedVoice,
        language: selectedLanguage,
        speed,
        pitch,
        volume
      });

      setActiveRecord(record);
      setHistory((current) => [record, ...current.filter((item) => item.id !== record.id)].slice(0, 10));
      toast.success("Speech generated successfully.");
      await refreshHistory(record.id);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Speech generation failed.";

      setPageError(message);
      toast.error(message);
      await refreshHistory();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Audio URL copied to your clipboard.");
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]" id="studio">
      <TTSForm
        capabilities={
          voicesResponse?.capabilities ?? { speed: true, pitch: true, volume: true }
        }
        errorMessage={pageError}
        isSubmitting={isSubmitting || isBootstrapping}
        languages={languages}
        maxTextLength={voicesResponse?.maxTextLength ?? 4500}
        onLanguageChange={setSelectedLanguage}
        onPitchChange={setPitch}
        onSpeedChange={setSpeed}
        onSubmit={handleSubmit}
        onTextChange={setText}
        onVoiceChange={setSelectedVoice}
        onVolumeChange={setVolume}
        pitch={pitch}
        providerName={voicesResponse?.provider ?? "loading"}
        selectedLanguage={selectedLanguage}
        selectedVoice={selectedVoice}
        speed={speed}
        text={text}
        voices={filteredVoices}
        volume={volume}
      />

      <div className="space-y-6">
        <AudioPlayer onCopyUrl={handleCopyUrl} record={activeRecord} />
        <HistoryList
          activeId={activeRecord?.id}
          isLoading={isRefreshingHistory || isBootstrapping}
          items={history}
          onSelect={setActiveRecord}
        />
      </div>
    </section>
  );
}
