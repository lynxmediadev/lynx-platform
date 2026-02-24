import type { Metadata } from "next";
import Link from "next/link";
import { Brush, FileText, Layers, Palette, PenTool, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Diseño Gráfico — Servicios",
  description:
    "Branding, campañas, piezas para redes y presentaciones premium con el estilo cinematográfico de ODR Records.",
};

const services = [
  { icon: PenTool, title: "Branding", desc: "Logotipo, sistema visual y guías rápidas listas para ejecutar." },
  { icon: Palette, title: "Piezas para RRSS", desc: "Carruseles, historias animadas, ads estáticos y motion ligero." },
  { icon: Layers, title: "Presentaciones & Pitch", desc: "Decks ejecutivos, keynote y storyboards con narrativa clara." },
  { icon: Brush, title: "Packaging & Merch", desc: "Mockups listos para imprenta y visuales 3D sencillos." },
];

const steps = [
  "Brief express (30-45 min) con referencias y objetivos.",
  "Moodboard y ruta visual con 2 alternativas claras.",
  "Primera entrega en 48-72h con ajustes incluidos.",
  "Entrega final en formatos editables y listos para publicación.",
];

const packs = [
  { name: "Starter", price: "Desde 250 USD", items: ["Logo + paleta", "3 posts + 2 stories", "Guía rápida de uso"] },
  { name: "Campaña", price: "Desde 520 USD", items: ["Concepto visual", "8-10 piezas multiformato", "Adaptaciones por plataforma"] },
  { name: "Pitch Pro", price: "Desde 690 USD", items: ["Deck 12-20 slides", "Gráficas soporte", "Mockups y cover animado opcional"] },
];

export default function DesignPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:px-6">
      <section className="rounded-[2px] border border-border bg-card/70 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Servicios</p>
            <h1 className="text-3xl font-semibold text-foreground">Diseño Gráfico</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Sistemas visuales, campañas y piezas listas para publicar con la estética cinematográfica de ODR Records.
              Procesos rápidos, entregables editables y consistentes en digital e impreso.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default" className="rounded-[2px]">
              <Link href="/servicios/mix">Agendar una llamada</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-[2px]">
              <Link href="/contact">Solicitar brief</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {services.map((s) => (
          <Card key={s.title} className="h-full border-border bg-card/70">
            <CardHeader className="flex flex-row items-center gap-3">
              <s.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-[2px] border border-border bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Proceso</h2>
        </div>
        <Separator className="my-4 bg-border/60" />
        <div className="grid gap-3 md:grid-cols-2">
          {steps.map((step, idx) => (
            <div key={step} className="flex gap-3 rounded-[2px] border border-border/60 bg-card/60 p-3 text-sm text-foreground">
              <span className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 text-center text-xs font-semibold text-primary">{idx + 1}</span>
              <p className="leading-snug text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2px] border border-border bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Paquetes</h2>
        </div>
        <Separator className="my-4 bg-border/60" />
        <div className="grid gap-4 md:grid-cols-3">
          {packs.map((pack) => (
            <Card key={pack.name} className="h-full border-border bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  {pack.name}
                  <span className="text-sm font-medium text-primary">{pack.price}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pack.items.map((item) => (
                  <div key={item} className="text-sm text-muted-foreground">
                    • {item}
                  </div>
                ))}
                <Button variant="outline" className="mt-3 w-full rounded-[2px]">
                  Solicitar este pack
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
