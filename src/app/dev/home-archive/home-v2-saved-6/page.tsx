import HomeVariantAssetCircuit from "@/components/home-v2/HomeVariantAssetCircuit";

export const metadata = {
  title: "Saved Home V2 6 | ODR Records",
  description: "Archived Home V2 option previously shown as 10/12.",
};

export default function SavedHomeV2SixPage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantAssetCircuit indicatorLabel="Saved 6 / old 10/12" />
      </div>
    </main>
  );
}
