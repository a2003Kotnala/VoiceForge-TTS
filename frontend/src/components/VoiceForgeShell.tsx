"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ApiError, api } from "@/lib/api";
import type {
  EmotionOption,
  HistoryRecord,
  TextAnalysisResponse,
  VoicesResponse
} from "@/lib/types";
import {
  estimateDuration,
  formatDuration,
  formatEmotionLabel,
  formatLanguageLabel,
  sanitizeTextInput
} from "@/lib/utils";

import { ActionBar } from "./ActionBar";
import { AdvancedSettings } from "./AdvancedSettings";
import { AudioPlayer } from "./AudioPlayer";
import { EmotionSelector } from "./EmotionSelector";
import { HistoryList } from "./HistoryList";
import { SectionCard } from "./ui/SectionCard";
import { TextEditor } from "./TextEditor";
import { VoiceSelector } from "./VoiceSelector";

const EMPTY_VOICES: VoicesResponse["voices"] = [];
const EMPTY_EMOTIONS: VoicesResponse["emotions"] = [];

function readNumber(
  metadata: Record<string, unknown> | null,
  key: string,
  fallback: number
) {
  const value = metadata?.[key];
  return typeof value === "number" ? value : fallback;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function VoiceForgeShell() {
  const [voicesResponse, setVoicesResponse] = useState<VoicesResponse | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<HistoryRecord | null>(null);
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<TextAnalysisResponse | null>(null);
  const [manualLanguageOverride, setManualLanguageOverride] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedEmotion, setSelectedEmotion] =
    useState<EmotionOption>("neutral");
  const [hasEditedEmotion, setHasEditedEmotion] = useState(false);
  const [hasEditedVoice, setHasEditedVoice] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [pauses, setPauses] = useState(1);
  const [expressiveness, setExpressiveness] = useState(0.5);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);
  const analyzeRequestId = useRef(0);

  async function loadInitialData() {
    setIsBootstrapping(true);
    setPageError(null);

    try {
      const [fetchedVoices, fetchedHistory] = await Promise.all([
        api.getVoices(),
        api.getHistory(9)
      ]);

      startTransition(() => {
        setVoicesResponse(fetchedVoices);
        setHistory(fetchedHistory.items);
        setSelectedLanguage((current) => current || fetchedVoices.defaults.language);
        setSelectedVoice((current) => current || fetchedVoices.defaults.voice || "");
        setSelectedEmotion((current) =>
          current === "neutral" ? fetchedVoices.defaults.emotion : current
        );
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load the TTS tool.";

      setPageError(message);
      toast.error(message);
    } finally {
      setIsBootstrapping(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  const voices = useMemo(
    () =>
      [...(voicesResponse?.voices ?? EMPTY_VOICES)].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.displayName.localeCompare(right.displayName);
      }),
    [voicesResponse]
  );

  const emotions = voicesResponse?.emotions ?? EMPTY_EMOTIONS;
  const languages = useMemo(
    () =>
      Array.from(new Set(voices.flatMap((voice) => voice.languages)))
        .sort((left, right) =>
          formatLanguageLabel(left).localeCompare(formatLanguageLabel(right))
        )
        .map((code) => ({
          code,
          label: formatLanguageLabel(code)
        })),
    [voices]
  );

  const filteredVoices = useMemo(() => {
    if (!selectedLanguage) {
      return EMPTY_VOICES;
    }

    return voices.filter((voice) => voice.languages.includes(selectedLanguage));
  }, [selectedLanguage, voices]);

  const visibleHistory = useMemo(() => {
    if (!voicesResponse?.provider) {
      return history;
    }

    return history.filter((item) => item.provider === voicesResponse.provider);
  }, [history, voicesResponse?.provider]);

  useEffect(() => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      setAnalysis(null);
      setIsAnalyzing(false);
      if (!manualLanguageOverride) {
        setSelectedLanguage(voicesResponse?.defaults.language ?? "");
      }
      if (!hasEditedEmotion) {
        setSelectedEmotion(voicesResponse?.defaults.emotion ?? "neutral");
      }
      return;
    }

    if (trimmedText.length < 8) {
      setAnalysis(null);
      return;
    }

    analyzeRequestId.current += 1;
    const currentRequestId = analyzeRequestId.current;
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);

      try {
        const result = await api.analyzeText(trimmedText);

        if (currentRequestId !== analyzeRequestId.current) {
          return;
        }

        setAnalysis(result);
        setPageError(null);

        if (!manualLanguageOverride) {
          setSelectedLanguage(result.detectedLanguage.code);
        }

        if (!hasEditedEmotion) {
          setSelectedEmotion(result.suggestedEmotion);
        }

        if (!hasEditedVoice && result.recommendedVoiceId) {
          setSelectedVoice(result.recommendedVoiceId);
        }
      } catch (error) {
        if (currentRequestId !== analyzeRequestId.current) {
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : "Unable to detect the language right now.";

        setPageError(message);
      } finally {
        if (currentRequestId === analyzeRequestId.current) {
          setIsAnalyzing(false);
        }
      }
    }, 420);

    return () => clearTimeout(timer);
  }, [hasEditedEmotion, hasEditedVoice, manualLanguageOverride, text, voicesResponse]);

  useEffect(() => {
    if (!selectedLanguage && languages.length && manualLanguageOverride) {
      setSelectedLanguage(languages[0].code);
    }
  }, [languages, manualLanguageOverride, selectedLanguage]);

  useEffect(() => {
    if (!filteredVoices.length) {
      return;
    }

    if (!filteredVoices.some((voice) => voice.id === selectedVoice)) {
      const preferred =
        filteredVoices.find((voice) => voice.recommended) ?? filteredVoices[0];
      setSelectedVoice(preferred.id);
    }
  }, [filteredVoices, selectedVoice]);

  const hasPendingChanges = useMemo(() => {
    if (!activeRecord) {
      return false;
    }

    const nextVoice = selectedVoice || activeRecord.voice;

    return (
      activeRecord.text.trim() !== text.trim() ||
      activeRecord.language !== selectedLanguage ||
      activeRecord.voice !== nextVoice ||
      activeRecord.emotion !== selectedEmotion ||
      readNumber(activeRecord.metadata, "requestedPace", 1) !== speed ||
      readNumber(activeRecord.metadata, "requestedPitch", 0) !== pitch ||
      readNumber(activeRecord.metadata, "requestedExpressiveness", 0.5) !==
        expressiveness ||
      readNumber(activeRecord.metadata, "requestedPauses", 1) !== pauses
    );
  }, [
    activeRecord,
    expressiveness,
    pauses,
    pitch,
    selectedEmotion,
    selectedLanguage,
    selectedVoice,
    speed,
    text
  ]);

  const currentRecord = useMemo(() => {
    if (!activeRecord) {
      return null;
    }

    if (hasPendingChanges) {
      return null;
    }

    if (voicesResponse?.provider && activeRecord.provider !== voicesResponse.provider) {
      return null;
    }

    return activeRecord;
  }, [activeRecord, hasPendingChanges, voicesResponse?.provider]);

  const selectedVoiceOption = useMemo(
    () =>
      filteredVoices.find((voice) => voice.id === selectedVoice) ??
      voices.find((voice) => voice.id === selectedVoice) ??
      null,
    [filteredVoices, selectedVoice, voices]
  );

  const estimatedDurationLabel = useMemo(
    () => formatDuration(estimateDuration(text, speed)),
    [speed, text]
  );

  const studioStatus = pageError
    ? "Needs attention"
    : isSubmitting
      ? "Rendering"
      : currentRecord?.audioUrl
        ? "Ready to play"
        : isAnalyzing
          ? "Reading the text"
          : "Waiting for input";

  const canGenerate =
    Boolean(text.trim()) &&
    Boolean(selectedLanguage) &&
    Boolean(selectedVoiceOption) &&
    text.trim().length <= (voicesResponse?.maxTextLength ?? 3200) &&
    !isBootstrapping;

  useEffect(() => {
    if (!activeRecord || !voicesResponse?.provider) {
      return;
    }

    if (activeRecord.provider !== voicesResponse.provider) {
      setActiveRecord(null);
    }
  }, [activeRecord, voicesResponse?.provider]);

  async function refreshHistory(preferredActiveId?: string) {
    setIsRefreshingHistory(true);

    try {
      const fetchedHistory = await api.getHistory(9);
      startTransition(() => {
        setHistory(fetchedHistory.items);

        if (preferredActiveId) {
          const matchingRecord = fetchedHistory.items.find(
            (item) => item.id === preferredActiveId
          );

          if (matchingRecord) {
            setActiveRecord(matchingRecord);
          }
        }
      });
    } finally {
      setIsRefreshingHistory(false);
    }
  }

  async function runGeneration() {
    const activeVoice =
      filteredVoices.find((voice) => voice.id === selectedVoice) ?? null;

    if (!text.trim()) {
      toast.error("Add some text before generating speech.");
      return;
    }

    if (!selectedLanguage) {
      toast.error("Choose a language before generating speech.");
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    try {
      const record = await api.generateSpeech({
        text,
        voice: activeVoice?.id,
        voiceLabel: activeVoice?.displayName,
        language: selectedLanguage,
        emotion: selectedEmotion,
        speed,
        pitch,
        pauses,
        expressiveness
      });

      startTransition(() => {
        setActiveRecord(record);
        setHistory((current) =>
          [record, ...current.filter((item) => item.id !== record.id)].slice(0, 9)
        );
      });
      toast.success("Speech is ready.");

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

  async function handleDownload() {
    if (!currentRecord?.audioUrl) {
      return;
    }

    try {
      const response = await fetch(currentRecord.audioUrl);

      if (!response.ok) {
        throw new Error("Audio download failed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      const extension = response.headers.get("content-type")?.includes("wav")
        ? "wav"
        : "mp3";
      const fileName = `tts-output-${slugify(
        formatLanguageLabel(currentRecord.language)
      )}-${slugify(currentRecord.emotion)}.${extension}`;

      downloadLink.href = objectUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Audio download failed."
      );
    }
  }

  function handleSelectHistory(record: HistoryRecord) {
    setActiveRecord(record);
    setText(record.text);
    setSelectedEmotion(record.emotion);
    setHasEditedEmotion(true);
    setSelectedLanguage(record.language);
    setManualLanguageOverride(true);
    setSelectedVoice(record.voice);
    setHasEditedVoice(true);
    setSpeed(readNumber(record.metadata, "requestedPace", 1));
    setPitch(readNumber(record.metadata, "requestedPitch", 0));
    setExpressiveness(readNumber(record.metadata, "requestedExpressiveness", 0.5));
    setPauses(readNumber(record.metadata, "requestedPauses", 1));
  }

  async function handleCopyText() {
    if (!text.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Text copied.");
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  }

  function handleClearText() {
    setText("");
    setPageError(null);
    setAnalysis(null);
    setHasEditedEmotion(false);
    setHasEditedVoice(false);
    setManualLanguageOverride(false);
  }

  return (
    <div className="space-y-6">
      <SectionCard className="overflow-hidden p-0">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-[color:var(--hero-glow)] blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[color:var(--hero-glow-strong)] blur-3xl" />
          </div>

          <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_300px]">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                  Studio Session
                </p>
                <h2 className="text-2xl tracking-[-0.04em] text-[color:var(--text-primary)] sm:text-3xl">
                  Keep the first render fast, then refine only what needs it.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
                  The editor, voice presets, and playback panel now work more like a
                  single production flow, so you can see the current state before
                  sending another generation request.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                    Session status
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">
                    {studioStatus}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                    Selected voice
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">
                    {selectedVoiceOption?.displayName ?? "Choose a voice"}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                    Delivery profile
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">
                    {formatEmotionLabel(selectedEmotion)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                    Live duration
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">
                    {estimatedDurationLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                Live guide
              </p>
              <div className="mt-4 space-y-4 text-sm leading-6 text-[color:var(--text-muted)]">
                <div>
                  <p className="font-medium text-[color:var(--text-primary)]">
                    Language
                  </p>
                  <p>
                    {analysis?.detectedLanguage
                      ? `${analysis.detectedLanguage.label} (${analysis.detectedLanguage.confidence})`
                      : selectedLanguage
                        ? formatLanguageLabel(selectedLanguage)
                        : "Waiting for enough text to detect"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-[color:var(--text-primary)]">
                    Provider
                  </p>
                  <p>
                    {voicesResponse?.provider
                      ? `${voicesResponse.provider.toUpperCase()} with ${voices.length} curated voices`
                      : "Loading provider details"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-[color:var(--text-primary)]">
                    Last render
                  </p>
                  <p>
                    {currentRecord?.voiceLabel
                      ? `${currentRecord.voiceLabel} in ${formatLanguageLabel(currentRecord.language)}`
                      : "No completed render yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_320px]">
          <div className="space-y-6">
            <TextEditor
              analysis={analysis?.detectedLanguage ?? null}
              isAnalyzing={isAnalyzing || isBootstrapping}
              languages={languages}
              manualLanguageOverride={manualLanguageOverride}
              maxTextLength={voicesResponse?.maxTextLength ?? 3200}
              onCleanText={() => setText((current) => sanitizeTextInput(current))}
              onCopy={handleCopyText}
              onClear={handleClearText}
              onLanguageChange={setSelectedLanguage}
              onManualLanguageOverrideChange={setManualLanguageOverride}
              onTextChange={(value) => {
                setPageError(null);
                setText(value);
              }}
              selectedLanguage={selectedLanguage}
              speed={speed}
              text={text}
            />

            <EmotionSelector
              emotions={emotions}
              onChange={(value) => {
                setSelectedEmotion(value);
                setHasEditedEmotion(true);
              }}
              selectedEmotion={selectedEmotion}
              suggestedEmotion={analysis?.suggestedEmotion ?? null}
            />

            <AdvancedSettings
              expressiveness={expressiveness}
              onExpressivenessChange={setExpressiveness}
              onPausesChange={setPauses}
              onPitchChange={setPitch}
              onSpeedChange={setSpeed}
              pauses={pauses}
              pitch={pitch}
              speed={speed}
            />

            {pageError ? (
              <div className="rounded-[1.4rem] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {pageError}
              </div>
            ) : null}

            <AudioPlayer
              hasPendingChanges={hasPendingChanges}
              record={currentRecord}
            />

            <ActionBar
              canGenerate={canGenerate}
              canDownload={Boolean(currentRecord?.audioUrl)}
              estimatedDuration={estimatedDurationLabel}
              hasAudio={Boolean(currentRecord?.audioUrl)}
              hasPendingChanges={hasPendingChanges}
              isGenerating={isSubmitting || isBootstrapping}
              onDownload={handleDownload}
              onGenerate={() => void runGeneration()}
              selectedVoiceLabel={selectedVoiceOption?.displayName ?? null}
            />
          </div>

          <VoiceSelector
            onVoiceChange={(value) => {
              setSelectedVoice(value);
              setHasEditedVoice(true);
            }}
            selectedVoice={selectedVoice}
            voices={filteredVoices}
          />
        </div>
      </SectionCard>

      <HistoryList
        activeId={
          visibleHistory.some((item) => item.id === activeRecord?.id)
            ? activeRecord?.id
            : undefined
        }
        isLoading={isRefreshingHistory || isBootstrapping}
        items={visibleHistory}
        onSelect={handleSelectHistory}
      />
    </div>
  );
}
