import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { HomeAsset } from "./data";
import { cn } from "@/lib/utils";

type Props = {
  asset: HomeAsset;
  className?: string;
  imageClassName?: string;
  compact?: boolean;
};

export default function HomeAssetTile({
  asset,
  className,
  imageClassName,
  compact = false,
}: Props) {
  const content = (
    <>
      <div className={cn("relative overflow-hidden bg-muted", compact ? "h-28" : "h-36 md:h-48", imageClassName)}>
        <div className="absolute inset-0 grid place-items-center px-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {asset.type}
        </div>
        <Image
          src={asset.image}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover contrast-110 saturate-90 transition duration-300 group-hover:scale-105 group-hover:saturate-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-70" />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-border p-2 text-[10px] uppercase tracking-[0.08em]">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{asset.title}</p>
          <p className="truncate text-muted-foreground">{asset.type}</p>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
          {asset.price}
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </>
  );

  return (
    <Link
      href={asset.href}
      className={cn(
        "group block min-w-0 border border-border bg-card transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {content}
    </Link>
  );
}
