import HomeVariantSplitDecision from "@/components/home-v2/HomeVariantSplitDecision";

export const metadata = {
  title: "Saved Home V2 5 | ODR Records",
  description: "Archived Home V2 option previously shown as 9/12.",
};

export default function SavedHomeV2FivePage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantSplitDecision indicatorLabel="Saved 5 / old 9/12" />
      </div>
    </main>
  );
}
