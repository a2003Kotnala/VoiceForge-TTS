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

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatLanguageLabel(code: string) {
  const [languageCode, regionCode] = code.split("-");
  const display = new Intl.DisplayNames(["en"], { type: "language" });
  const regionDisplay = new Intl.DisplayNames(["en"], { type: "region" });
  const language = display.of(languageCode) ?? code;
  const region = regionCode ? regionDisplay.of(regionCode) : undefined;

  return region ? `${language} (${region})` : language;
}
