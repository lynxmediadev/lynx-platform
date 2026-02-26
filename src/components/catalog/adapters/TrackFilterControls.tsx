"use client";

import { ChevronDown } from "lucide-react";

type Props = {
  mobile: boolean;
  searchTerm: string;
  onSearchTermChange: (next: string) => void;
  activeMood: string;
  onActiveMoodChange: (next: string) => void;
  activeUse: string;
  onActiveUseChange: (next: string) => void;
  activeGenre: string;
  onActiveGenreChange: (next: string) => void;
  bpmMin: string;
  onBpmMinChange: (next: string) => void;
  bpmMax: string;
  onBpmMaxChange: (next: string) => void;
  moodOptions: string[];
  useOptions: string[];
  genreOptions: string[];
  filterSelectClass: string;
};

export default function TrackFilterControls({
  mobile,
  searchTerm,
  onSearchTermChange,
  activeMood,
  onActiveMoodChange,
  activeUse,
  onActiveUseChange,
  activeGenre,
  onActiveGenreChange,
  bpmMin,
  onBpmMinChange,
  bpmMax,
  onBpmMaxChange,
  moodOptions,
  useOptions,
  genreOptions,
  filterSelectClass,
}: Props) {
  if (mobile) {
    return (
      <>
        <label className="min-w-0">
          <span className="sr-only">Buscar</span>
          <input
            data-catalog-search="true"
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Buscar..."
            className="h-7 w-full rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/90 focus:border-foreground focus:outline-none"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="min-w-0">
            <span className="sr-only">Mood</span>
            <div className="relative">
              <select
                value={activeMood}
                onChange={(event) => onActiveMoodChange(event.target.value)}
                className={filterSelectClass}
              >
                <option value="all">Mood</option>
                {moodOptions.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/90" />
            </div>
          </label>

          <label className="min-w-0">
            <span className="sr-only">Uso</span>
            <div className="relative">
              <select
                value={activeUse}
                onChange={(event) => onActiveUseChange(event.target.value)}
                className={filterSelectClass}
              >
                <option value="all">Uso</option>
                {useOptions.map((use) => (
                  <option key={use} value={use}>
                    {use}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/90" />
            </div>
          </label>
        </div>

        <label className="mt-3 block min-w-0">
          <span className="sr-only">Género</span>
          <div className="relative">
            <select
              value={activeGenre}
              onChange={(event) => onActiveGenreChange(event.target.value)}
              className={filterSelectClass}
            >
              <option value="all">Género</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/90" />
          </div>
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="min-w-0">
            <span className="sr-only">BPM mínimo</span>
            <input
              type="number"
              min={0}
              max={400}
              step={1}
              inputMode="numeric"
              value={bpmMin}
              onChange={(event) => onBpmMinChange(event.target.value)}
              placeholder="Min"
              className="h-7 w-full rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/90 focus:border-foreground focus:outline-none"
            />
          </label>

          <label className="min-w-0">
            <span className="sr-only">BPM máximo</span>
            <input
              type="number"
              min={0}
              max={400}
              step={1}
              inputMode="numeric"
              value={bpmMax}
              onChange={(event) => onBpmMaxChange(event.target.value)}
              placeholder="Max"
              className="h-7 w-full rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/90 focus:border-foreground focus:outline-none"
            />
          </label>
        </div>
      </>
    );
  }

  return (
    <>
      <label className="min-w-[220px] flex-1 basis-[280px]">
        <span className="sr-only">Buscar</span>
        <input
          data-catalog-search="true"
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Buscar..."
          className="h-7 w-full rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/90 focus:border-foreground focus:outline-none"
        />
      </label>

      <label className="w-[120px] shrink-0">
        <span className="sr-only">Mood</span>
        <div className="relative">
          <select
            value={activeMood}
            onChange={(event) => onActiveMoodChange(event.target.value)}
            className={filterSelectClass}
          >
            <option value="all">Mood</option>
            {moodOptions.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/90" />
        </div>
      </label>

      <label className="w-[120px] shrink-0">
        <span className="sr-only">Uso</span>
        <div className="relative">
          <select
            value={activeUse}
            onChange={(event) => onActiveUseChange(event.target.value)}
            className={filterSelectClass}
          >
            <option value="all">Uso</option>
            {useOptions.map((use) => (
              <option key={use} value={use}>
                {use}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/90" />
        </div>
      </label>

      <label className="w-[130px] shrink-0">
        <span className="sr-only">Género</span>
        <div className="relative">
          <select
            value={activeGenre}
            onChange={(event) => onActiveGenreChange(event.target.value)}
            className={filterSelectClass}
          >
            <option value="all">Género</option>
            {genreOptions.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/90" />
        </div>
      </label>

      <label className="w-[78px] shrink-0">
        <span className="sr-only">BPM mínimo</span>
        <input
          type="number"
          min={0}
          max={400}
          step={1}
          inputMode="numeric"
          value={bpmMin}
          onChange={(event) => onBpmMinChange(event.target.value)}
          placeholder="Min"
          className="h-7 w-full rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/90 focus:border-foreground focus:outline-none"
        />
      </label>

      <label className="w-[78px] shrink-0">
        <span className="sr-only">BPM máximo</span>
        <input
          type="number"
          min={0}
          max={400}
          step={1}
          inputMode="numeric"
          value={bpmMax}
          onChange={(event) => onBpmMaxChange(event.target.value)}
          placeholder="Max"
          className="h-7 w-full rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/90 focus:border-foreground focus:outline-none"
        />
      </label>
    </>
  );
}
