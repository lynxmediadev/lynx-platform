import HomeVariantTen from "@/components/home-v2/HomeVariantTen";

export const metadata = {
  title: "Saved Home V2 1 | ODR Records",
  description: "Archived Home V2 option previously shown as 5/12.",
};

export default function SavedHomeV2OnePage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantTen indicatorLabel="Saved 1 / old 5/12" />
      </div>
    </main>
  );
}
