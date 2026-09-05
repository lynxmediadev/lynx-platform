"use client";

import {
  CollectionBrowser,
  CollectionFilterShell,
  type CollectionViewMode,
} from "@/components/collection";
import TrackFilterControls from "./TrackFilterControls";
import TrackGridItem from "./TrackGridItem";
import TrackListItem from "./TrackListItem";
import TrackDetailPanel from "./TrackDetailPanel";
import type { CatalogLicenseCard, CatalogTrack, ProgressMap } from "./types";

type Props = {
  tracks: CatalogTrack[];
  totalTracks: number;
  selectedTrackId: string | null;
  selectedTrack: CatalogTrack | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  progressMap: ProgressMap;
  showDetailPanel: boolean;
  viewMode: CollectionViewMode;
  onViewModeChange: (next: CollectionViewMode) => void;
  compact: boolean;
  shouldShowFilteringControls: boolean;
  hasActiveTrackFilters: boolean;
  mobileFiltersOpen: boolean;
  onMobileFiltersOpenChange: (next: boolean) => void;
  onClearTrackFilters: (options?: { focusSearch?: boolean }) => void;
  onSelectTrackId: (id: string) => void;
  onPlayTrack: (track: CatalogTrack) => void;
  onSeekTrack: (track: CatalogTrack, ratio: number) => void;
  resolveCoverUrl: (track: CatalogTrack) => string;
  getTrackDurationLabel: (track: CatalogTrack) => string;
  formatTime: (seconds: number) => string;
  filterSelectClass: string;
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
  panelDuration: number;
  panelProgress: number;
  panelCurrentSec: number;
  panelTrackIsPlaying: boolean;
  selectedTrackBpmBadge: string;
  selectedTrackBpmValue: number | null;
  selectedTrackGenreLabel: string;
  selectedTrackLicenseLabel: string;
  selectedTrackSyncLabel: string;
  selectedTrackMoods: string[];
  selectedTrackUses: string[];
  selectedTrackLicenseCards: CatalogLicenseCard[];
};

export default function TrackCollectionBrowser({
  tracks,
  totalTracks,
  selectedTrackId,
  selectedTrack,
  currentTrackId,
  isPlaying,
  progressMap,
  showDetailPanel,
  viewMode,
  onViewModeChange,
  compact,
  shouldShowFilteringControls,
  hasActiveTrackFilters,
  mobileFiltersOpen,
  onMobileFiltersOpenChange,
  onClearTrackFilters,
  onSelectTrackId,
  onPlayTrack,
  onSeekTrack,
  resolveCoverUrl,
  getTrackDurationLabel,
  formatTime,
  filterSelectClass,
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
  panelDuration,
  panelProgress,
  panelCurrentSec,
  panelTrackIsPlaying,
  selectedTrackBpmBadge,
  selectedTrackBpmValue,
  selectedTrackGenreLabel,
  selectedTrackLicenseLabel,
  selectedTrackSyncLabel,
  selectedTrackMoods,
  selectedTrackUses,
  selectedTrackLicenseCards,
}: Props) {
  return (
    <CollectionBrowser
      items={tracks}
      totalItems={totalTracks}
      selectedId={selectedTrackId}
      onSelectedIdChange={(next) => {
        if (!next) return;
        onSelectTrackId(next);
      }}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      showDetailPanel={showDetailPanel}
      filterShell={
        shouldShowFilteringControls ? (
          <CollectionFilterShell
            enabled
            compact={compact}
            visibleCount={tracks.length}
            totalCount={totalTracks}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            hasActiveFilters={hasActiveTrackFilters}
            onClear={() => onClearTrackFilters()}
            mobileOpen={mobileFiltersOpen}
            onMobileOpenChange={onMobileFiltersOpenChange}
            renderMobileControls={() => (
              <TrackFilterControls
                mobile
                searchTerm={searchTerm}
                onSearchTermChange={onSearchTermChange}
                activeMood={activeMood}
                onActiveMoodChange={onActiveMoodChange}
                activeUse={activeUse}
                onActiveUseChange={onActiveUseChange}
                activeGenre={activeGenre}
                onActiveGenreChange={onActiveGenreChange}
                bpmMin={bpmMin}
                onBpmMinChange={onBpmMinChange}
                bpmMax={bpmMax}
                onBpmMaxChange={onBpmMaxChange}
                moodOptions={moodOptions}
                useOptions={useOptions}
                genreOptions={genreOptions}
                filterSelectClass={filterSelectClass}
              />
            )}
            renderDesktopControls={({ toolbar }) => (
              <div className="hidden min-w-0 items-end gap-1.5 sm:flex sm:flex-wrap">
                <TrackFilterControls
                  mobile={false}
                  searchTerm={searchTerm}
                  onSearchTermChange={onSearchTermChange}
                  activeMood={activeMood}
                  onActiveMoodChange={onActiveMoodChange}
                  activeUse={activeUse}
                  onActiveUseChange={onActiveUseChange}
                  activeGenre={activeGenre}
                  onActiveGenreChange={onActiveGenreChange}
                  bpmMin={bpmMin}
                  onBpmMinChange={onBpmMinChange}
                  bpmMax={bpmMax}
                  onBpmMaxChange={onBpmMaxChange}
                  moodOptions={moodOptions}
                  useOptions={useOptions}
                  genreOptions={genreOptions}
                  filterSelectClass={filterSelectClass}
                />
                <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
                  {toolbar}
                </div>
              </div>
            )}
          />
        ) : null
      }
      renderNoItemsState={
        <div className="border-border bg-background/70 text-muted-foreground rounded-2xl border px-5 py-8 text-sm">
          No hay tracks disponibles en este catálogo.
        </div>
      }
      renderNoResultsState={
        <div className="border-border bg-background/70 text-muted-foreground space-y-3 rounded-2xl border px-5 py-8 text-sm">
          <p>No encontramos tracks con esos filtros.</p>
          {hasActiveTrackFilters && (
            <button
              type="button"
              onClick={() => onClearTrackFilters({ focusSearch: true })}
              className="border-foreground/70 text-foreground hover:border-foreground rounded border px-3 py-1.5 text-xs font-semibold transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      }
      renderGridItem={({ item, isSelected }) => {
        const isActive = item.id === currentTrackId;
        const showPause = isActive && isPlaying;
        return (
          <TrackGridItem
            track={item}
            isSelected={isSelected}
            isActive={isActive}
            showPause={showPause}
            progress={progressMap[item.id] ?? 0}
            coverUrl={resolveCoverUrl(item)}
            onSelect={() => onSelectTrackId(item.id)}
            onPlay={() => onPlayTrack(item)}
          />
        );
      }}
      renderListItem={({ item, isSelected }) => {
        const isActive = item.id === currentTrackId;
        const showPause = isActive && isPlaying;
        return (
          <TrackListItem
            track={item}
            isSelected={isSelected}
            isActive={isActive}
            showPause={showPause}
            progress={progressMap[item.id] ?? 0}
            coverUrl={resolveCoverUrl(item)}
            durationLabel={getTrackDurationLabel(item)}
            onSelect={() => onSelectTrackId(item.id)}
            onPlay={() => onPlayTrack(item)}
          />
        );
      }}
      renderDetailPanel={() => (
        <TrackDetailPanel
          selectedTrack={selectedTrack}
          panelDuration={panelDuration}
          panelProgress={panelProgress}
          panelCurrentSec={panelCurrentSec}
          panelTrackIsPlaying={panelTrackIsPlaying}
          selectedTrackBpmBadge={selectedTrackBpmBadge}
          selectedTrackBpmValue={selectedTrackBpmValue}
          selectedTrackGenreLabel={selectedTrackGenreLabel}
          selectedTrackLicenseLabel={selectedTrackLicenseLabel}
          selectedTrackSyncLabel={selectedTrackSyncLabel}
          selectedTrackMoods={selectedTrackMoods}
          selectedTrackUses={selectedTrackUses}
          selectedTrackLicenseCards={selectedTrackLicenseCards}
          formatTime={formatTime}
          onPlayTrack={onPlayTrack}
          onSeekTrack={onSeekTrack}
          resolveCoverUrl={resolveCoverUrl}
        />
      )}
    />
  );
}
