// src/app/fonts.ts
import {
  Inter,
  Lato,
  Hanken_Grotesk as HankenGrotesk,
  Dancing_Script,
  Anton,
} from "next/font/google";

/** INTER — títulos/menú (variable + italic) */
export const inter = Inter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-inter",
});

/** LATO — subtítulos/botones (pesos + italic) */
export const lato = Lato({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
  variable: "--font-lato",
});

/** HANKEN GROTESK — párrafos (OFL, alternativa a HK Guise) */
export const hankenGrotesk = HankenGrotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-hanken-grotesk",
});

export const dancingScript = Dancing_Script({
  subsets: ["latin"],
  style: ["normal"], // no hay italic explícito, ya es script
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dancing-script",
});

export const anton = Anton({
  subsets: ["latin"], // puedes agregar "latin-ext" si necesitas soporte extendido
  weight: "400", // único peso disponible
  variable: "--font-anton", // lo registras como variable CSS para usar en Tailwind
  display: "swap", // buena práctica para evitar FOUT
});
