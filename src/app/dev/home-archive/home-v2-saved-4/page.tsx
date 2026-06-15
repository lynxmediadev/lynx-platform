import HomeVariantSoundMuseum from "@/components/home-v2/HomeVariantSoundMuseum";

export const metadata = {
  title: "Saved Home V2 4 | ODR Records",
  description: "Archived Home V2 option previously shown as 8/12.",
};

export default function SavedHomeV2FourPage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantSoundMuseum indicatorLabel="Saved 4 / old 8/12" />
      </div>
    </main>
  );
}
