// src/app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { inter, lato, hankenGrotesk, dancingScript, anton } from "./fonts";
import FrontendShell from "@/components/site/FrontendShell";

export const metadata: Metadata = {
  title: "ODR Records — Sync Licensing",
  description: "Catálogo y servicios de música para cine/TV/publicidad.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontVars = `${inter.variable} ${lato.variable} ${hankenGrotesk.variable} ${dancingScript.variable} ${anton.variable}`;

  return (
    <html lang="es" className={`${fontVars} dark-`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <FrontendShell>{children}</FrontendShell>
      </body>
    </html>
  );
}
