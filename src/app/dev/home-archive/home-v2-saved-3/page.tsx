import HomeVariantDropLedger from "@/components/home-v2/HomeVariantDropLedger";

export const metadata = {
  title: "Saved Home V2 3 | ODR Records",
  description: "Archived Home V2 option previously shown as 7/12.",
};

export default function SavedHomeV2ThreePage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantDropLedger indicatorLabel="Saved 3 / old 7/12" />
      </div>
    </main>
  );
}
