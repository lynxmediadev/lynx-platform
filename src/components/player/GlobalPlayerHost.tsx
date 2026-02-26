"use client";

import CatalogBottomPlayerV2 from "@/components/catalog/CatalogBottomPlayerV2";
import { useGlobalPlayer, useGlobalPlayerState } from "@/components/player/global-player-context";

export default function GlobalPlayerHost() {
  const {
    currentTrack,
    isPlaying,
    currentSec,
    durationSec,
    progress,
    volume,
    hasPrev,
    hasNext,
  } = useGlobalPlayerState();
  const {
    togglePlay,
    playPrev,
    playNext,
    seekByTime,
    setVolume,
    toggleMute,
    closePlayer,
  } = useGlobalPlayer();

  if (!currentTrack) return null;

  return (
    <CatalogBottomPlayerV2
      trackId={currentTrack.id}
      title={currentTrack.title}
      artist={currentTrack.artist}
      coverUrl={currentTrack.coverUrl ?? ""}
      waveformB64={currentTrack.waveformB64 ?? null}
      isPlaying={isPlaying}
      currentSec={currentSec}
      durationSec={durationSec}
      progress={progress}
      volume={volume}
      hasPrev={hasPrev}
      hasNext={hasNext}
      onTogglePlay={togglePlay}
      onPrev={playPrev}
      onNext={playNext}
      onSeek={seekByTime}
      onVolumeChange={setVolume}
      onToggleMute={toggleMute}
      onClose={closePlayer}
    />
  );
}

