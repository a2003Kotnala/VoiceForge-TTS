"use client";

import { Copy, Sparkles, Trash2 } from "lucide-react";

import type { LanguageDetection } from "@/lib/types";
import {
  cn,
  estimateDuration,
  formatDuration,
  getCharacterState
} from "@/lib/utils";

type LanguageOption = {
  code: string;
  label: string;
};

type TextEditorProps = {
  text: string;
  maxTextLength: number;
  speed: number;
  analysis: LanguageDetection | null;
  selectedLanguage: string;
  manualLanguageOverride: boolean;
  languages: LanguageOption[];
  isAnalyzing: boolean;
  onTextChange: (value: string) => void;
  onCopy: () => void;
  onClear: () => void;
  onCleanText: () => void;
  onLanguageChange: (value: string) => void;
  onManualLanguageOverrideChange: (value: boolean) => void;
};

function getConfidenceLabel(confidence: LanguageDetection["confidence"]) {
  switch (confidence) {
    case "high":
      return "Auto";
    case "medium":
      return "Auto, check if needed";
    default:
      return "Auto, low confidence";
  }
}

export function TextEditor({
  text,
  maxTextLength,
  speed,
  analysis,
  selectedLanguage,
  manualLanguageOverride,
  languages,
  isAnalyzing,
  onTextChange,
  onCopy,
  onClear,
  onCleanText,
  onLanguageChange,
  onManualLanguageOverrideChange
}: TextEditorProps) {
  const characterState = getCharacterState(text.length, maxTextLength);
  const estimatedDuration = formatDuration(estimateDuration(text, speed));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--text-primary)]">Text</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-subtle)]">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1",
                characterState === "normal" &&
                  "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text-muted)]",
                characterState === "warning" && "border-amber-400/30 bg-amber-500/10 text-amber-200",
                characterState === "error" && "border-rose-400/30 bg-rose-500/10 text-rose-200"
              )}
            >
              {text.length}/{maxTextLength}
            </span>
            <span>{estimatedDuration} estimated</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
            onClick={onCopy}
            type="button"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
            onClick={onCleanText}
            type="button"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Clean
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
            onClick={onClear}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      <textarea
        className="min-h-[22rem] w-full resize-none rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-4 text-[15px] leading-7 text-[color:var(--text-primary)] outline-none transition placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--border-strong)]"
        maxLength={maxTextLength + 400}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Paste a paragraph, script, announcement, or note you want to hear out loud."
        spellCheck={false}
        value={text}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-muted)]">
          <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2.5 py-1">
            {isAnalyzing
              ? "Language Detected: checking..."
              : analysis
                ? `Language Detected: ${analysis.label} (${getConfidenceLabel(
                    analysis.confidence
                  )})`
                : "Auto-detect unavailable"}
          </span>
          <button
            className="transition hover:text-[color:var(--text-primary)]"
            onClick={() => onManualLanguageOverrideChange(!manualLanguageOverride)}
            type="button"
          >
            {manualLanguageOverride ? "Use auto" : "Change"}
          </button>
        </div>

        {(manualLanguageOverride || analysis?.needsReview) && languages.length ? (
          <label className="flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
            <span>Language</span>
            <select
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-xs text-[color:var(--text-primary)] outline-none"
              onChange={(event) => onLanguageChange(event.target.value)}
              value={selectedLanguage}
            >
              {languages.map((language) => (
                <option
                  className="bg-[color:var(--surface-strong)]"
                  key={language.code}
                  value={language.code}
                >
                  {language.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );
}
