import { notFound, redirect } from "next/navigation";
import {
  PlaylistStatus,
  PlaylistVisibility,
  ServiceOfferStatus,
  SoundKitStatus,
} from "@prisma/client";
import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";
import { ShowcaseCampaignEditor } from "@/components/admin/showcase/ShowcaseCampaignEditor";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function clip(value: string, max = 100) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default async function ShowcaseCampaignPage({ params }: RouteParams) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  if (!user) {
    const resolvedParams = await params;
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/showcase/campaigns/${resolvedParams.id}`)}`);
  }

  const { id } = await params;

  const [campaign, tracks, playlists, soundKits, services, artists] = await Promise.all([
    prisma.bannerPromotion.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        isActive: true,
        startsAt: true,
        endsAt: true,
        notes: true,
        updatedAt: true,
        slot: {
          select: {
            id: true,
            key: true,
            name: true,
            format: true,
            isEnabled: true,
          },
        },
        items: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            targetType: true,
            targetId: true,
            titleOverride: true,
            subtitleOverride: true,
            imageUrlOverride: true,
            ctaLabel: true,
            ctaHrefOverride: true,
            sortOrder: true,
            isEnabled: true,
            startsAt: true,
            endsAt: true,
            durationMs: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.track.findMany({
      where: {
        NOT: { audioUrl: "" },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 240,
      select: {
        id: true,
        title: true,
        artist: true,
        bpm: true,
      },
    }),
    prisma.playlist.findMany({
      where: {
        status: PlaylistStatus.PUBLISHED,
        visibility: PlaylistVisibility.PUBLIC,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 120,
      select: {
        id: true,
        name: true,
        publicId: true,
        status: true,
        visibility: true,
      },
    }),
    prisma.soundKit.findMany({
      where: { status: SoundKitStatus.PUBLISHED },
      orderBy: [{ updatedAt: "desc" }],
      take: 120,
      select: {
        id: true,
        name: true,
        status: true,
      },
    }),
    prisma.serviceOffer.findMany({
      where: { status: ServiceOfferStatus.ACTIVE },
      orderBy: [{ updatedAt: "desc" }],
      take: 120,
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
      },
    }),
    prisma.track.findMany({
      where: {
        artist: { not: "" },
        NOT: { audioUrl: "" },
      },
      orderBy: [{ updatedAt: "desc" }],
      distinct: ["artist"],
      take: 120,
      select: {
        artist: true,
      },
    }),
  ]);

  if (!campaign || !campaign.slot) {
    notFound();
  }

  const targets = {
    tracks: tracks.map((track) => ({
      id: track.id,
      label: clip(
        `${track.title} · ${track.artist || "Artista"}${track.bpm ? ` · ${Math.round(track.bpm)} BPM` : ""}`,
      ),
      hint: track.id,
    })),
    playlists: playlists.map((playlist) => ({
      id: playlist.id,
      label: clip(`${playlist.name} · ${playlist.visibility}/${playlist.status}`),
      hint: playlist.publicId,
    })),
    soundKits: soundKits.map((kit) => ({
      id: kit.id,
      label: clip(`${kit.name} · ${kit.status}`),
    })),
    services: services.map((service) => ({
      id: service.id,
      label: clip(`${service.name} · ${service.category}`),
    })),
    artists: artists
      .map((artist) => artist.artist.trim())
      .filter(Boolean)
      .map((artist) => ({
        id: artist,
        label: artist,
      })),
  };

  return (
    <section>
      <ShowcaseCampaignEditor
        campaign={{
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          priority: campaign.priority,
          isActive: campaign.isActive,
          startsAt: toIso(campaign.startsAt),
          endsAt: toIso(campaign.endsAt),
          notes: campaign.notes,
          updatedAt: campaign.updatedAt.toISOString(),
          slot: {
            id: campaign.slot.id,
            key: campaign.slot.key,
            name: campaign.slot.name,
            format: campaign.slot.format,
            isEnabled: campaign.slot.isEnabled,
          },
          items: campaign.items.map((item) => ({
            ...item,
            startsAt: toIso(item.startsAt),
            endsAt: toIso(item.endsAt),
            updatedAt: item.updatedAt.toISOString(),
          })),
        }}
        targets={targets}
      />
    </section>
  );
}
