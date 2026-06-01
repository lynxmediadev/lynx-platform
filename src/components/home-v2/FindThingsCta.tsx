import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  dark?: boolean;
};

export default function FindThingsCta({ className, dark = false }: Props) {
  return (
    <Link
      href="/catalog"
      className={cn(
        "group inline-flex items-center gap-3 border-b-2 pb-1 font-cinema-title text-4xl uppercase leading-none tracking-normal transition md:text-6xl",
        dark
          ? "border-background text-background hover:opacity-75"
          : "border-foreground text-foreground hover:opacity-75",
        className,
      )}
    >
      <span>Find Things</span>
      <ArrowRight className="h-8 w-8 transition-transform group-hover:translate-x-1 md:h-12 md:w-12" />
    </Link>
  );
}
