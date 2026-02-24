import { redirect } from "next/navigation";
import { PromotionCampaignStatus } from "@prisma/client";
import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";
import { ShowcaseSlotsManager } from "@/components/admin/showcase/ShowcaseSlotsManager";

export const dynamic = "force-dynamic";

export default async function AdminShowcasePage() {
  const user = await requireRole(["ADMIN", "STAFF"]);
  if (!user) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/showcase")}`);
  }

  const slots = await prisma.promotionSlot.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      key: true,
      name: true,
      format: true,
      description: true,
      isEnabled: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          campaigns: true,
        },
      },
      campaigns: {
        where: {
          status: PromotionCampaignStatus.LIVE,
          isActive: true,
        },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        take: 1,
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          startsAt: true,
          endsAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return (
    <section>
      <ShowcaseSlotsManager
        initialSlots={slots.map((slot) => ({
          id: slot.id,
          key: slot.key,
          name: slot.name,
          format: slot.format,
          description: slot.description,
          isEnabled: slot.isEnabled,
          createdAt: slot.createdAt.toISOString(),
          updatedAt: slot.updatedAt.toISOString(),
          campaignCount: slot._count.campaigns,
          liveCampaign: slot.campaigns[0]
            ? {
                ...slot.campaigns[0],
                startsAt: slot.campaigns[0].startsAt?.toISOString() ?? null,
                endsAt: slot.campaigns[0].endsAt?.toISOString() ?? null,
                updatedAt: slot.campaigns[0].updatedAt.toISOString(),
              }
            : null,
        }))}
      />
    </section>
  );
}
