import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";

const boards = [
  { title: "Audio assets", href: "/catalog", image: "/images/hero/hero3.jpg", meta: "Loops / samples / beats" },
  { title: "Merch drops", href: "/catalog", image: "/images/hero/hero4.jpg", meta: "Ropa / formatos fisicos" },
  { title: "Pro services", href: "/servicios/mix", image: "/images/hero/hero5.jpg", meta: "Mix / master / sound" },
];

export default function HomeVariantFour() {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border p-4 md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Navigation board</p>
          <h1 className="mt-1 font-cinema-title text-5xl uppercase leading-none tracking-normal md:text-7xl">
            Choose a lane
          </h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </div>
      <div className="grid min-h-0 grid-cols-1 md:grid-cols-3">
        {boards.map((board, index) => (
          <Link
            key={board.title}
            href={board.href}
            className="group relative min-h-0 overflow-hidden border-b border-border p-3 md:border-b-0 md:border-r md:p-5"
          >
            <Image
              src={board.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover grayscale opacity-55 transition duration-300 group-hover:scale-105 group-hover:opacity-75"
            />
            <div className="absolute inset-0 bg-background/55" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>0{index + 1}</span>
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-cinema-title text-5xl uppercase leading-none tracking-normal md:text-7xl">{board.title}</h2>
                <p className="mt-2 text-xs uppercase tracking-[0.12em]">{board.meta}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="border-t border-border p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-4">
        Built for discovery, licensing and product drops.
      </div>
      <HomeOptionIndicator index={4} total={10} />
    </section>
  );
}
