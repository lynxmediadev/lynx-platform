import HomeVariantTwo from "@/components/home-v2/HomeVariantTwo";

export const metadata = {
  title: "Saved Home Template 1 | ODR Records",
  description: "Archived homepage visual direction saved for later review.",
};

export default function SavedHomeTemplateOnePage() {
  return (
    <main className="-mx-4 sm:-mx-6">
      <div style={{ height: "calc(100dvh - var(--header-h))" }}>
        <HomeVariantTwo indicatorLabel="Saved template 1" />
      </div>
    </main>
  );
}
