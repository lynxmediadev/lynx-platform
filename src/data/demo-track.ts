// ================================================
// File: src/data/demo-track.ts
// Centralized demo track + factory
import type { PlayerTrackDTO } from "@/domain/track";

export const DEMO_TRACK: PlayerTrackDTO = {
  id: "demo-base",
  title: "Golden Horizon (Demo)",
  artist: "Lynx Music Collective",
  audioUrl: "/audio/demo.mp3",
  coverUrl: "/images/covers/hero-bg-01.jpg",
  moods: ["Epic", "Emotional", "Elegant"],
  uses: ["TV", "Cine", "Publicidad", "Trailers", "Videojuegos"],
  identifiers: { isrc: "CL-XYZ-25-00001" },
  rights: {
    master: "ODR Records (One-Stop)",
    publishingSplit: "100% Lynx Music Collective",
    licenseType: "No exclusiva",
    territories: "Worldwide",
    restrictions: ["Sin campañas políticas"],
    contentID: { enrolled: true, admin: "Identifyy", whitelist: "licensing@lynxmedia.cl" },
  },
};

export function makeDemoTrack(id: string, overrides: Partial<PlayerTrackDTO> = {}): PlayerTrackDTO {
  return { ...DEMO_TRACK, id, ...overrides };
}
