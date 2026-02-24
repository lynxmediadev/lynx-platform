// ================================================
// File: src/mocks/track-store.ts
// Título: Demos locales para fallback
// Descripción: Devuelve tracks de ejemplo si DB no responde o no existe el ID.
// Qué hace: Asegura que /player/api-demo siempre tenga algo que renderizar.
// Peras y manzanas: “Si no encuentro en la libreta, te muestro la muestra del catálogo.”
// ================================================
export type PlayerTrackDTO = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  moods: string[];
  uses: string[];
  identifiers?: { isrc?: string; iswc?: string; upc?: string };
  rights?: {
    master?: string;
    publishingSplit?: string;
    licenseType?: string;
    exclusiveTerritories?: string[];
    exclusiveTermMonths?: number;
    mediaBuy?: string;
    mfn?: boolean;
    restrictions?: string[];
    contentID?: { enrolled?: boolean; admin?: string; whitelist?: string };
  };
};

const base: Omit<PlayerTrackDTO, "id" | "title"> = {
  artist: "Lynx Music Collective",
  // Asegúrate de tener un MP3 en /public/audio/demo.mp3
  audioUrl: "/audio/demo.mp3",
  // En tu zip hay imágenes en /public/images/hero
  coverUrl: "/images/hero/hero-bg-1.png",
  moods: ["Epic", "Emotional", "Elegant"],
  uses: ["TV", "Cine", "Publicidad", "Trailers", "Videojuegos"],
  rights: {
    master: "ODR Records (One-Stop)",
    publishingSplit: "100% Lynx Music Collective",
    licenseType: "NON_EXCLUSIVE",
    exclusiveTerritories: ["WORLDWIDE"],
    restrictions: ["Sin campañas políticas"],
  },
};

const DEMOS: PlayerTrackDTO[] = [
  { id: "demo-001", title: "Golden Horizon (Demo)", ...base },
  { id: "demo-002", title: "Golden Horizon (Edit 60s)", ...base },
  { id: "demo-003", title: "Golden Horizon (Edit 30s)", ...base },
];

export function getTrackById(id: string): PlayerTrackDTO | null {
  return DEMOS.find((t) => t.id === id) ?? null;
}
