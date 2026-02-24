import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";
import { ShowcaseSlotDetailManager } from "@/components/admin/showcase/ShowcaseSlotDetailManager";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ slotId: string }>;
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export default async function ShowcaseSlotPage({ params }: RouteParams) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  if (!user) {
    const resolvedParams = await params;
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/showcase/slots/${resolvedParams.slotId}`)}`);
  }

  const { slotId } = await params;

  const slot = await prisma.promotionSlot.findUnique({
    where: { id: slotId },
    select: {
      id: true,
      key: true,
      name: true,
      format: true,
      description: true,
      isEnabled: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
      campaigns: {
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
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
          _count: {
            select: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!slot) {
    notFound();
  }

  return (
    <section>
      <ShowcaseSlotDetailManager
        slot={{
          id: slot.id,
          key: slot.key,
          name: slot.name,
          format: slot.format,
          description: slot.description,
          isEnabled: slot.isEnabled,
          settings: slot.settings,
          createdAt: slot.createdAt.toISOString(),
          updatedAt: slot.updatedAt.toISOString(),
        }}
        initialCampaigns={slot.campaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          priority: campaign.priority,
          isActive: campaign.isActive,
          startsAt: toIso(campaign.startsAt),
          endsAt: toIso(campaign.endsAt),
          notes: campaign.notes,
          updatedAt: campaign.updatedAt.toISOString(),
          itemCount: campaign._count.items,
        }))}
      />
    </section>
  );
}
