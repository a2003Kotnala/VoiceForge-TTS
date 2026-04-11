import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function getCharacterState(current: number, max: number) {
  const ratio = current / max;

  if (ratio > 1) {
    return "error";
  }

  if (ratio >= 0.85) {
    return "warning";
  }

  return "normal";
}

export function sanitizeTextInput(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatEmotionLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function estimateDuration(text: string, speed = 1) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const baseWordsPerMinute = 150;
  const effectiveWpm = Math.max(95, baseWordsPerMinute * speed);

  return (wordCount / effectiveWpm) * 60;
}

export function formatLanguageLabel(code: string) {
  const [languageCode, regionCode] = code.split("-");
  const display = new Intl.DisplayNames(["en"], { type: "language" });
  const regionDisplay = new Intl.DisplayNames(["en"], { type: "region" });
  const language = display.of(languageCode) ?? code;
  const region = regionCode ? regionDisplay.of(regionCode) : undefined;

  return region ? `${language} (${region})` : language;
}
