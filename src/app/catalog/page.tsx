import CatalogClient from "@/app/catalog/CatalogClient";
import CatalogView from "@/components/catalog/CatalogView";
import { getMainCatalogPlaylist } from "@/lib/playlists/service";
import { fetchPlaylistCatalogTracks } from "@/lib/catalog/fetchPlaylistTracks";
import { resolveShowcaseSlides } from "@/lib/banner-promotions/service";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const useLegacyCatalog = (process.env.CATALOG_USE_LEGACY ?? "").trim() === "1";
  if (useLegacyCatalog) {
    const sp = searchParams ? await searchParams : undefined;
    const moods = toArray(sp?.mood).map((m) => m.trim()).filter(Boolean);
    const uses = toArray(sp?.use).map((u) => u.trim()).filter(Boolean);
    const categories = toArray(sp?.cat).map((c) => c.trim()).filter(Boolean);
    const artist = pickFirst(sp?.artist)?.trim() ?? "";
    const q = pickFirst(sp?.q)?.trim() ?? "";

    return (
      <CatalogView
        catalogSlug={categories[0] ?? null}
        filters={{ moods, uses, artist: artist || undefined, q: q || undefined }}
        eyebrow="ODR Records"
        title="Catálogo público (legacy)"
        subtitle="Modo compatibilidad temporal activado por CATALOG_USE_LEGACY=1."
      />
    );
  }

  const playlist = await getMainCatalogPlaylist();

  if (!playlist) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalog</p>
        <h1 className="text-2xl font-semibold">Catálogo sin playlist principal</h1>
        <p className="text-sm text-muted-foreground">
          Define una playlist como principal desde el dashboard (`/admin/playlists`) para publicar
          el catálogo en esta ruta.
        </p>
      </section>
    );
  }

  if (playlist.visibility !== "PUBLIC" || playlist.status !== "PUBLISHED") {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalog</p>
        <h1 className="text-2xl font-semibold">El catálogo principal no está publicado</h1>
        <p className="text-sm text-muted-foreground">
          Publica la playlist principal (estado PUBLISHED + visibilidad PUBLIC) desde
          `/admin/playlists`.
        </p>
      </section>
    );
  }

  const tracks = await fetchPlaylistCatalogTracks({
    playlistId: playlist.id,
    ownerUserId: playlist.ownerUserId,
    isAutoAllTracks: playlist.isAutoAllTracks,
    limit: 220,
  });

  const heroSlides = await resolveShowcaseSlides({
    slotKey: "catalog.hero.main",
    limit: 12,
  });

  return (
    <section className="w-full bg-[var(--lm-bg-deep)] py-4 sm:py-6">
      <CatalogClient
        tracks={tracks}
        heroSlides={heroSlides}
        title={playlist.name || "ODR Records Catalog"}
        subtitle={
          playlist.description ||
          "Catálogo principal de ODR Records para revisar tracks y licenciamiento."
        }
        eyebrow="ODR Records"
        categories={[]}
      />
    </section>
  );
}

export const metadata = {
  alternates: { canonical: "/catalog" },
};
