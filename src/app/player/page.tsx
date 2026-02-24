// ================================================
// File: src/app/player/page.tsx
// Test page to mount the reusable AudioPlayer component(s)
// ================================================
import type { Metadata } from "next";
import { AudioPlayerDemo } from "@/components/ui/AudioPlayerDemo";

export const metadata: Metadata = {
  title: "Player demo | ODR Records",
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 lg:px-10 xl:px-14">
      <h1 className="mb-4 text-[20px] font-bold tracking-tight md:text-[22px]">
        Player — Demo
      </h1>

      <p className="mb-4 text-[14.5px] text-muted-foreground">
        Este reproductor es reutilizable y seguirá la línea editorial de ODR Records.
        La fila inferior está reservada para la barra de progreso y los tags; la fila superior contiene controles y acciones.
      </p>

      <div className="space-y-3">
        <AudioPlayerDemo id="demo-001" />
        <AudioPlayerDemo id="demo-002" overrides={{ title: "Golden Horizon (Edit 60s)" }} />
        <AudioPlayerDemo id="demo-003" overrides={{ title: "Golden Horizon (Instrumental)" }} />
      </div>
    </main>
  );
}
