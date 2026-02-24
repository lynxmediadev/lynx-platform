// ================================================
// File: src/app/player/api-demo/page.tsx
// Título: Demo — 3 players via API
// Descripción: Pide 3 IDs a /api/tracks/:id (con fallback a demo).
// Qué hace: Valida que API y Player funcionen en conjunto.
// Peras y manzanas: “Traigo tres canciones y las toco en fila.”
// ================================================
import type { Metadata } from "next";
import { headers } from "next/headers";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { getJSON } from "@/lib/http";

export const metadata: Metadata = { title: "Player API demo | ODR Records" };

type PlayerTrackDTO = {
  id: string; title: string; artist: string; audioUrl: string; coverUrl?: string;
  moods: string[]; uses: string[];
};

async function absoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}${path}`;
}

async function fetchTrack(id: string): Promise<PlayerTrackDTO> {
  const url = await absoluteUrl(`/api/tracks/${id}`);
  return getJSON<PlayerTrackDTO>(url, { cache: "no-store" });
}

export default async function Page() {
  const [t1, t2, t3] = await Promise.all([
    fetchTrack("demo-001"),
    fetchTrack("demo-002"),
    fetchTrack("demo-003"),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 lg:px-10 xl:px-14">
      <h1 className="mb-4 text-[20px] font-bold tracking-tight md:text-[22px]">
        Player — API Demo
      </h1>
      <p className="mb-4 text-[14.5px] text-muted-foreground">
        Estos players consumen datos desde <code>/api/tracks/:id</code>.
      </p>
      <div className="space-y-3">
        <AudioPlayer track={t1} />
        <AudioPlayer track={t2} />
        <AudioPlayer track={t3} />
      </div>
    </main>
  );
}
