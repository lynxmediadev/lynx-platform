import HomeVariantMonitorWall from "@/components/home-v2/HomeVariantMonitorWall";

export const metadata = {
  title: "Saved Home V2 8 | ODR Records",
  description: "Archived Home V2 option previously shown as 12/12.",
};

export default function SavedHomeV2EightPage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantMonitorWall indicatorLabel="Saved 8 / old 12/12" />
      </div>
    </main>
  );
}
