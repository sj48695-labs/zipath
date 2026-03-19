"use client";

import { useState, useCallback } from "react";

interface AreaRange {
  min?: number;
  max?: number;
}

interface AreaFilterProps {
  onFilterChange: (range: AreaRange) => void;
}

interface PresetOption {
  label: string;
  value: string;
  min?: number;
  max?: number;
}

const PRESETS: PresetOption[] = [
  { label: "전체", value: "all" },
  { label: "~60㎡ (소형)", value: "small", max: 60 },
  { label: "60~85㎡ (중형)", value: "medium", min: 60, max: 85 },
  { label: "85~135㎡ (대형)", value: "large", min: 85, max: 135 },
  { label: "135㎡~ (초대형)", value: "xlarge", min: 135 },
];

export default function AreaFilter({ onFilterChange }: AreaFilterProps) {
  const [selected, setSelected] = useState("all");
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const handlePresetClick = useCallback(
    (preset: PresetOption) => {
      setSelected(preset.value);
      if (preset.value === "all") {
        setCustomMin("");
        setCustomMax("");
        onFilterChange({});
      } else {
        setCustomMin(preset.min !== undefined ? String(preset.min) : "");
        setCustomMax(preset.max !== undefined ? String(preset.max) : "");
        onFilterChange({ min: preset.min, max: preset.max });
      }
    },
    [onFilterChange],
  );

  const handleCustomApply = useCallback(() => {
    setSelected("custom");
    const min = customMin ? Number(customMin) : undefined;
    const max = customMax ? Number(customMax) : undefined;
    onFilterChange({ min, max });
  }, [customMin, customMax, onFilterChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleCustomApply();
      }
    },
    [handleCustomApply],
  );

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">평형별 필터</h3>

      {/* Preset buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === preset.value
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setSelected("custom")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === "custom"
              ? "bg-primary text-primary-foreground"
              : "border hover:bg-accent"
          }`}
        >
          직접 입력
        </button>
      </div>

      {/* Custom range input */}
      {selected === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="최소 (㎡)"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-28 rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
          <span className="text-sm text-muted-foreground">~</span>
          <input
            type="number"
            min={0}
            placeholder="최대 (㎡)"
            value={customMax}
            onChange={(e) => setCustomMax(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-28 rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleCustomApply}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
}
