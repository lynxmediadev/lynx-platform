export type HomeAsset = {
  title: string;
  type: string;
  price: string;
  image: string;
  href: string;
};

export type HomeVariantProps = {
  optionIndex?: number;
  optionTotal?: number;
  indicatorLabel?: string;
};

export const homeAssets: HomeAsset[] = [
  {
    title: "Midnight Purr",
    type: "Sync track",
    price: "License",
    image: "/images/hero/hero1.jpg",
    href: "/track/seed-001",
  },
  {
    title: "Neon Whiskers",
    type: "Sample pack",
    price: "Asset",
    image: "/images/hero/hero2.jpg",
    href: "/catalog",
  },
  {
    title: "Golden Horizon",
    type: "Instrumental",
    price: "Catalog",
    image: "/images/hero/hero3.jpg",
    href: "/track/seed-001",
  },
  {
    title: "Archive Jacket",
    type: "Merch",
    price: "Drop",
    image: "/images/hero/hero4.jpg",
    href: "/catalog",
  },
  {
    title: "Voice Pack",
    type: "Publicidad",
    price: "Service",
    image: "/images/hero/hero5.jpg",
    href: "/servicios/sound-design",
  },
  {
    title: "Tape Loops",
    type: "Loops",
    price: "Bundle",
    image: "/images/hero/hero6.jpg",
    href: "/catalog",
  },
  {
    title: "48h Mix Pass",
    type: "Mix/Master",
    price: "Service",
    image: "/images/hero/48hpf.jpg",
    href: "/servicios/mix",
  },
  {
    title: "ODR Cassette",
    type: "Physical",
    price: "Merch",
    image: "/images/hero/hero7.jpg",
    href: "/catalog",
  },
  {
    title: "Broadcast Stems",
    type: "Stems",
    price: "License",
    image: "/images/covers/hero-bg-01.jpg",
    href: "/catalog",
  },
  {
    title: "Logo Audio Kit",
    type: "Brand sound",
    price: "Service",
    image: "/images/covers/hero-bg-1.png",
    href: "/servicios/sound-design",
  },
];

export const categories = [
  "Drums",
  "Loops",
  "Samples",
  "Beats",
  "Instrumentales",
  "Voces",
  "Locuciones",
  "Merch",
  "Mix/Master",
];
