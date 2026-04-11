"use client";

import type { ChangeEvent } from "react";

type SliderProps = {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueLabel: string;
  startLabel: string;
  endLabel: string;
  onChange: (value: number) => void;
};

type AdvancedSettingsProps = {
  speed: number;
  pitch: number;
  pauses: number;
  expressiveness: number;
  onSpeedChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onPausesChange: (value: number) => void;
  onExpressivenessChange: (value: number) => void;
};

function Slider({
  label,
  hint,
  min,
  max,
  step,
  value,
  valueLabel,
  startLabel,
  endLabel,
  onChange
}: SliderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <label className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[color:var(--text-primary)]">{label}</p>
          <p className="text-xs leading-5 text-[color:var(--text-muted)]">{hint}</p>
        </div>
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2.5 py-1 text-xs text-[color:var(--text-secondary)]">
          {valueLabel}
        </span>
      </div>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--border)] accent-[color:var(--accent)]"
        max={max}
        min={min}
        onChange={handleChange}
        step={step}
        type="range"
        value={value}
      />
      <div className="flex items-center justify-between text-[11px] text-[color:var(--text-faint)]">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </label>
  );
}

function getPitchLabel(value: number) {
  if (value <= -1.2) {
    return "Lower";
  }

  if (value >= 1.2) {
    return "Brighter";
  }

  return "Balanced";
}

function getExpressivenessLabel(value: number) {
  if (value <= 0.34) {
    return "Stable";
  }

  if (value >= 0.67) {
    return "Expressive";
  }

  return "Balanced";
}

function getPauseLabel(value: number) {
  if (value <= 0.86) {
    return "Tighter";
  }

  if (value >= 1.15) {
    return "More space";
  }

  return "Balanced";
}

export function AdvancedSettings({
  speed,
  pitch,
  pauses,
  expressiveness,
  onSpeedChange,
  onPitchChange,
  onPausesChange,
  onExpressivenessChange
}: AdvancedSettingsProps) {
  return (
    <details className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
      <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--text-primary)]">
        Advanced Settings
      </summary>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        <Slider
          endLabel="Faster"
          hint="Stay close to the middle for the most natural result."
          label="Speed"
          max={1.2}
          min={0.8}
          onChange={onSpeedChange}
          startLabel="Slower"
          step={0.01}
          value={speed}
          valueLabel={`${speed.toFixed(2)}x`}
        />
        <Slider
          endLabel="Brighter"
          hint="Subtle lift for the voice, not a dramatic effect."
          label="Pitch"
          max={2}
          min={-2}
          onChange={onPitchChange}
          startLabel="Lower"
          step={0.1}
          value={pitch}
          valueLabel={getPitchLabel(pitch)}
        />
        <Slider
          endLabel="More space"
          hint="Add more breathing room between phrases."
          label="Pauses"
          max={1.4}
          min={0.7}
          onChange={onPausesChange}
          startLabel="Tighter"
          step={0.01}
          value={pauses}
          valueLabel={getPauseLabel(pauses)}
        />
        <Slider
          endLabel="More expressive"
          hint="Shift the delivery from steadier to more animated."
          label="Delivery"
          max={1}
          min={0}
          onChange={onExpressivenessChange}
          startLabel="More stable"
          step={0.01}
          value={expressiveness}
          valueLabel={getExpressivenessLabel(expressiveness)}
        />
      </div>
    </details>
  );
}
