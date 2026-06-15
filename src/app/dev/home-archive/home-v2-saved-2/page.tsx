import HomeVariantPortalGrid from "@/components/home-v2/HomeVariantPortalGrid";

export const metadata = {
  title: "Saved Home V2 2 | ODR Records",
  description: "Archived Home V2 option previously shown as 6/12.",
};

export default function SavedHomeV2TwoPage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantPortalGrid indicatorLabel="Saved 2 / old 6/12" />
      </div>
    </main>
  );
}
