import HomeVariantProductTicker from "@/components/home-v2/HomeVariantProductTicker";

export const metadata = {
  title: "Saved Home V2 7 | ODR Records",
  description: "Archived Home V2 option previously shown as 11/12.",
};

export default function SavedHomeV2SevenPage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantProductTicker indicatorLabel="Saved 7 / old 11/12" />
      </div>
    </main>
  );
}
