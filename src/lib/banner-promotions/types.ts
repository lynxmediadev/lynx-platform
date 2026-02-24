export type CatalogHeroSlide = {
  id: string;
  promotionId: string;
  promotionItemId: string | null;
  sourceType: "TRACK" | "PLAYLIST" | "SOUND_KIT" | "SERVICE_OFFER" | "ARTIST" | "EXTERNAL_URL";
  sourceId: string | null;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  playableTrackId: string | null;
  durationMs: number;
};

