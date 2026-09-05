"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

type StepId = "project" | "details" | "contact";

type ProjectType = "single" | "album";

type Currency = "CLP" | "USD" | "EUR";

type Contact = {
  name: string;
  email: string;
  company: string;
  notes: string;
  phone: string;
};

// ── Pricing constants (edítalos aquí) ────────────────────────────────────────────
const BASE_PRICE_CLP = 30000; // base por 12 tracks
const TRACK_PRICE_CLP = 1200; // por track extra (desde 13)
const MAX_TRACKS = 72;

// Factores CLP → moneda (ajusta según tipo de cambio actual)
const currencyFactors: Record<Currency, number> = {
  CLP: 1,
  USD: 0.0011,
  EUR: 0.001,
};

const addons = {
  drumQuantize: 20000,
  vocalTunePerTrack: 20000,
  acapella: 10000,
  instrumental: 15000,
  liveBacking: 20000,
  rush: 35000,
  unlimitedRevs: 40000,
};

export default function MixFormClient() {
  const { toast } = useToast();
  const [step, setStep] = useState<StepId>("project");
  const [projectType, setProjectType] = useState<ProjectType>("single");
  const [currency, setCurrency] = useState<Currency>("CLP");
  const [contact, setContact] = useState<Contact>({
    name: "",
    email: "",
    company: "",
    notes: "",
    phone: "",
  });
  const [tracks, setTracks] = useState<number>(12);
  const [drumQuantize, setDrumQuantize] = useState(false);
  const [vocalTracks, setVocalTracks] = useState<number>(0);
  const [addonChecks, setAddonChecks] = useState({
    acapella: false,
    instrumental: false,
    liveBacking: false,
    rush: false,
    unlimitedRevs: false,
  });
  const [albumInfo, setAlbumInfo] = useState({
    songs: 1,
    timeline: "1 mes",
    style: "",
    notes: "",
  });
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
    video: string;
  } | null>(null);

  const steps = useMemo(
    () => [
      { id: "project" as StepId, label: "Tipo de proyecto" },
      { id: "details" as StepId, label: "Configuración" },
      { id: "contact" as StepId, label: "Datos de contacto" },
    ],
    [],
  );

  function goNext() {
    if (step === "details" && projectType === "single" && tracks < 12) {
      setErrors(["Para Single Track se requieren al menos 12 tracks."]);
      setStep("details");
      return;
    }
    if (step === "details" && projectType === "single" && overMaxTracks) {
      setErrors([
        "Tracks superiores a 72 requieren cotización manual. Ajusta la cantidad o continúa con contacto.",
      ]);
      setStep("details");
      return;
    }
    setStep((prev) => {
      if (prev === "project") return "details";
      if (prev === "details") return "contact";
      return prev;
    });
  }

  function goBack() {
    setStep((prev) => {
      if (prev === "contact") return "details";
      if (prev === "details") return "project";
      return prev;
    });
  }

  const overMaxTracks = tracks > MAX_TRACKS;

  const pricing = useMemo(() => {
    if (projectType !== "single" || overMaxTracks) {
      return {
        totalClp: null,
        breakdown: [] as Array<{ label: string; amount: number }>,
      };
    }
    const breakdown: Array<{ label: string; amount: number }> = [];
    breakdown.push({ label: "Base (12 tracks)", amount: BASE_PRICE_CLP });

    const extraTracks = Math.max(0, tracks - 12);
    if (extraTracks > 0) {
      breakdown.push({
        label: `Tracks extra (${extraTracks} x $${TRACK_PRICE_CLP.toLocaleString("es-CL")})`,
        amount: extraTracks * TRACK_PRICE_CLP,
      });
    }
    if (drumQuantize)
      breakdown.push({
        label: "Cuantización batería",
        amount: addons.drumQuantize,
      });
    if (vocalTracks > 0) {
      breakdown.push({
        label: `Voz manual (${vocalTracks} track${vocalTracks > 1 ? "s" : ""})`,
        amount: vocalTracks * addons.vocalTunePerTrack,
      });
    }
    if (addonChecks.acapella)
      breakdown.push({ label: "Acapella", amount: addons.acapella });
    if (addonChecks.instrumental)
      breakdown.push({ label: "Instrumental", amount: addons.instrumental });
    if (addonChecks.liveBacking)
      breakdown.push({
        label: "Backing track live",
        amount: addons.liveBacking,
      });
    if (addonChecks.rush)
      breakdown.push({
        label: "Entrega rápida (2 días hábiles)",
        amount: addons.rush,
      });
    if (addonChecks.unlimitedRevs)
      breakdown.push({
        label: "Revisiones ilimitadas",
        amount: addons.unlimitedRevs,
      });

    const totalClp = breakdown.reduce((acc, item) => acc + item.amount, 0);
    return { totalClp, breakdown };
  }, [
    projectType,
    overMaxTracks,
    tracks,
    drumQuantize,
    vocalTracks,
    addonChecks,
  ]);

  const totalInCurrency = useMemo(() => {
    if (pricing.totalClp == null) return null;
    const factor = currencyFactors[currency] ?? 1;
    return pricing.totalClp * factor;
  }, [pricing.totalClp, currency]);

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, "Nombre requerido"),
        email: z.string().email("Email inválido"),
        company: z.string().optional(),
        notes: z.string().optional(),
        phone: z.string().optional(),
      }),
    [],
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  function buildPayload() {
    const base = {
      projectType,
      currency,
      contact,
      pageUrl: typeof window !== "undefined" ? window.location.href : null,
      paymentIntentId: null as string | null, // placeholder para futuro pago en línea
    };
    if (projectType === "single") {
      return {
        ...base,
        single: {
          tracks,
          overMax: overMaxTracks,
          drumQuantize,
          vocalTracks,
          addons: addonChecks,
          pricingClp: pricing.totalClp,
          breakdown: pricing.breakdown,
        },
      };
    }
    return {
      ...base,
      album: {
        songs: albumInfo.songs,
        timeline: albumInfo.timeline,
        style: albumInfo.style,
        notes: albumInfo.notes,
      },
    };
  }

  function handleSubmit() {
    const parsed = contactSchema.safeParse(contact);
    if (!parsed.success) {
      setErrors(parsed.error.errors.map((e) => e.message));
      return;
    }
    setErrors([]);
    setLoading(true);
    setSubmitMessage(null);
    const payload = buildPayload();
    fetch("/api/services/mix", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        setSubmitMessage("Solicitud enviada. Te contactaremos pronto.");
        toast({ description: "Solicitud enviada con éxito." });
      })
      .catch((err: any) => {
        setErrors([err.message || "Error al enviar. Intenta nuevamente."]);
        toast({
          description: err.message || "Error al enviar. Intenta nuevamente.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
        {/* Hero */}
        <section className="border-border bg-card rounded-[2px] border p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
              Servicios · Mix &amp; Master
            </p>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-2xl leading-tight font-semibold">
                  Lleva tu mezcla al siguiente nivel
                </h1>
                <p className="text-muted-foreground text-sm">
                  Single track o EP/Álbum. Selecciona tu ruta, define opciones y
                  deja tus datos. Calcularemos o coordinaremos una cotización
                  según el proyecto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("project")}
                className="border-border bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-[2px] border px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Comenzar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="border-border bg-card rounded-[2px] border p-4 shadow-sm">
          <div className="grid gap-2 md:grid-cols-3">
            {steps.map((s) => {
              const isActive = s.id === step;
              const isDone =
                steps.findIndex((x) => x.id === s.id) <
                steps.findIndex((x) => x.id === step);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "border-border flex items-center justify-between rounded-[2px] border px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "bg-background/60 text-muted-foreground",
                  )}
                >
                  <span className="truncate">{s.label}</span>
                  {isDone ? (
                    <CheckCircle2 className="text-foreground h-4 w-4" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Step content */}
        <section className="border-border bg-card rounded-[2px] border p-5 shadow-sm">
          {step === "project" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg leading-tight font-semibold">
                  Selecciona el tipo de proyecto
                </h2>
                <p className="text-muted-foreground text-sm">
                  Elige si calculamos rápido un Single Track o si coordinamos
                  EP/Álbum para cotizar contigo.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ProjectCard
                  title="Single Track"
                  description="Cálculo rápido con tracks, add-ons y moneda seleccionable."
                  active={projectType === "single"}
                  onSelect={() => setProjectType("single")}
                />
                <ProjectCard
                  title="EP / Álbum"
                  description="Formulario simple y reunión para cotizar varias canciones."
                  active={projectType === "album"}
                  onSelect={() => setProjectType("album")}
                />
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg leading-tight font-semibold">
                    Configuración
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {projectType === "single"
                      ? "Define tracks, add-ons y moneda (cálculo en tiempo real)."
                      : "Cuéntanos sobre tu EP/Álbum para coordinar cotización."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="text-muted-foreground text-sm"
                    htmlFor="currency"
                  >
                    Moneda
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) =>
                      setCurrency(e.target.value as typeof currency)
                    }
                    className="border-border bg-background focus-visible:ring-ring focus-visible:ring-offset-background h-9 rounded-[2px] border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <option value="CLP">CLP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {projectType === "single" ? (
                <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                  <div className="border-border bg-background/60 space-y-4 rounded-[2px] border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-foreground text-sm font-semibold">
                            Tracks y cálculo base
                          </h3>
                          <InfoIconWithTooltip
                            label="Cómo calculamos el precio por track"
                            onClick={() =>
                              setInfoModal(infoData.tracksBase ?? null)
                            }
                          />
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Base ${BASE_PRICE_CLP.toLocaleString("es-CL")} por 12
                          tracks. Extra track: $
                          {TRACK_PRICE_CLP.toLocaleString("es-CL")}.
                        </p>
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        Max {MAX_TRACKS} tracks
                      </span>
                    </div>
                    <label className="flex flex-col gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Cantidad de tracks
                      </span>
                      <input
                        type="number"
                        min={12}
                        max={99}
                        value={tracks}
                        onChange={(e) => setTracks(Number(e.target.value) || 0)}
                        className={cn(
                          "bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background h-10 rounded-[2px] border px-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                          tracks < 12 || overMaxTracks
                            ? "border-amber-500/70"
                            : "border-border",
                        )}
                      />
                      {overMaxTracks ? (
                        <p className="rounded-[2px] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                          Para canciones con 73+ tracks, agenda una reunión para
                          cotizar tu proyecto específico.
                        </p>
                      ) : null}
                    </label>

                    <div className="space-y-2">
                      <h4 className="text-foreground text-sm font-semibold">
                        Add-ons
                      </h4>
                      <label className="text-foreground flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={drumQuantize}
                          onChange={(e) => setDrumQuantize(e.target.checked)}
                          className="border-border bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background h-4 w-4 rounded-[2px] border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                          disabled={overMaxTracks}
                        />
                        Cuantización de batería (+$
                        {addons.drumQuantize.toLocaleString("es-CL")})
                        <InfoIconWithTooltip
                          label="Detalles de cuantización de batería"
                          onClick={() =>
                            setInfoModal(infoData.drumQuantize ?? null)
                          }
                        />
                      </label>

                      <label className="text-foreground flex flex-col gap-1 text-sm">
                        <span className="inline-flex items-center gap-2">
                          Edición/afinación manual de voz
                          <InfoIconWithTooltip
                            label="Cómo afinamos la voz"
                            onClick={() => setInfoModal(infoData.vocal ?? null)}
                          />
                        </span>
                        <select
                          value={vocalTracks}
                          onChange={(e) =>
                            setVocalTracks(Number(e.target.value) || 0)
                          }
                          disabled={overMaxTracks}
                          className="border-border bg-background focus-visible:ring-ring focus-visible:ring-offset-background h-9 rounded-[2px] border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          {Array.from({ length: 11 }).map((_, idx) => {
                            const val = idx;
                            const extra = val * addons.vocalTunePerTrack;
                            return (
                              <option key={val} value={val}>
                                {val === 0
                                  ? "No"
                                  : `${val} Track${val > 1 ? "s" : ""} (+$${extra.toLocaleString("es-CL")})`}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {(
                          [
                            "acapella",
                            "instrumental",
                            "liveBacking",
                            "rush",
                            "unlimitedRevs",
                          ] as const
                        ).map((key) => (
                          <label
                            key={key}
                            className="text-foreground flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={addonChecks[key]}
                              onChange={(e) =>
                                setAddonChecks((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }))
                              }
                              className="border-border bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background h-4 w-4 rounded-[2px] border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                              disabled={overMaxTracks}
                            />
                            {addonLabel(key)}
                            <InfoIconWithTooltip
                              label="Ver detalles"
                              onClick={() =>
                                setInfoModal(infoData[key] ?? null)
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-border bg-background/60 flex h-full flex-col justify-between rounded-[2px] border p-4">
                    <div>
                      <h3 className="text-foreground text-sm font-semibold">
                        Resumen
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Actualiza en tiempo real según tus selecciones.
                      </p>
                      {overMaxTracks ? (
                        <p className="mt-3 rounded-[2px] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                          Tracks superiores a 72 requieren cotización manual.
                          Continúa y coordinaremos contigo.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2 text-sm">
                          {pricing.breakdown.map((item) => (
                            <li
                              key={item.label}
                              className="text-foreground flex items-center justify-between"
                            >
                              <span>{item.label}</span>
                              <span className="text-muted-foreground">
                                ${item.amount.toLocaleString("es-CL")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="border-border bg-card mt-4 rounded-[2px] border px-3 py-2">
                      <div className="text-foreground flex items-center justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span>
                          {pricing.totalClp == null
                            ? "Cotizar manual"
                            : formatCurrency(totalInCurrency ?? 0, currency)}
                        </span>
                      </div>
                      {pricing.totalClp != null && currency !== "CLP" ? (
                        <p className="text-muted-foreground text-xs">
                          Base CLP ${pricing.totalClp.toLocaleString("es-CL")} ·
                          factor {currencyFactors[currency]}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-2 text-xs">
                        Pago en línea (próximamente). Por ahora coordinamos por
                        correo con este valor estimado.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                  <div className="border-border bg-background/60 space-y-4 rounded-[2px] border p-4">
                    <div className="space-y-1">
                      <h3 className="text-foreground text-sm font-semibold">
                        Brief EP / Álbum
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Cuéntanos lo esencial para coordinar una reunión y
                        cotizar a medida.
                      </p>
                    </div>
                    <label className="text-foreground flex flex-col gap-1 text-sm">
                      <span>Número de canciones</span>
                      <input
                        type="number"
                        min={1}
                        value={albumInfo.songs}
                        onChange={(e) =>
                          setAlbumInfo((prev) => ({
                            ...prev,
                            songs: Number(e.target.value) || 1,
                          }))
                        }
                        className="border-border bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background h-10 rounded-[2px] border px-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      />
                    </label>
                    <label className="text-foreground flex flex-col gap-1 text-sm">
                      <span>Plazo deseado</span>
                      <select
                        value={albumInfo.timeline}
                        onChange={(e) =>
                          setAlbumInfo((prev) => ({
                            ...prev,
                            timeline: e.target.value,
                          }))
                        }
                        className="border-border bg-background focus-visible:ring-ring focus-visible:ring-offset-background h-9 rounded-[2px] border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <option value="1 mes">1 mes (mínimo)</option>
                        <option value="2 meses">2 meses</option>
                        <option value="3 meses">3 meses</option>
                        <option value="Mas tiempo">Más tiempo</option>
                      </select>
                    </label>
                    <LabeledInput
                      label="Estilo del álbum"
                      value={albumInfo.style}
                      onChange={(v) =>
                        setAlbumInfo((prev) => ({ ...prev, style: v }))
                      }
                      placeholder="Género/estilo (ej: indie, trap, orquestal...)"
                    />
                    <LabeledTextArea
                      label="Notas relevantes"
                      value={albumInfo.notes}
                      onChange={(v) =>
                        setAlbumInfo((prev) => ({ ...prev, notes: v }))
                      }
                      placeholder="Contexto, referencias, expectativas."
                    />
                  </div>

                  <div className="border-border bg-background/60 flex h-full flex-col justify-between rounded-[2px] border p-4">
                    <div>
                      <h3 className="text-foreground text-sm font-semibold">
                        Cotización a medida
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Para EP/Álbum coordinamos reunión online, aclaramos
                        alcance y enviamos propuesta.
                      </p>
                    </div>
                    <div className="border-border bg-card mt-4 rounded-[2px] border px-3 py-2">
                      <p className="text-foreground text-sm font-semibold">
                        Agendar reunión / Solicitar cotización
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Continúa al Paso 3 y envía tus datos; coordinaremos
                        fecha y hora contigo. Pago en línea se activará más
                        adelante.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "contact" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg leading-tight font-semibold">
                  Datos de contacto
                </h2>
                <p className="text-muted-foreground text-sm">
                  Recolectamos datos básicos para enviarte la propuesta. Valida
                  tu email antes de enviar.
                </p>
                {errors.length ? (
                  <div className="rounded-[2px] border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {errors.map((e) => (
                      <div key={e}>{e}</div>
                    ))}
                  </div>
                ) : null}
                {submitMessage ? (
                  <div className="rounded-[2px] border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                    {submitMessage}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <LabeledInput
                  label="Nombre"
                  value={contact.name}
                  onChange={(v) => setContact((c) => ({ ...c, name: v }))}
                  placeholder="Tu nombre"
                  required
                />
                <LabeledInput
                  label="Email"
                  value={contact.email}
                  onChange={(v) => setContact((c) => ({ ...c, email: v }))}
                  placeholder="correo@dominio.com"
                  type="email"
                  required
                />
                <LabeledInput
                  label="Compañía (opcional)"
                  value={contact.company}
                  onChange={(v) => setContact((c) => ({ ...c, company: v }))}
                  placeholder="Productora / Agencia"
                />
                <LabeledInput
                  label="Teléfono (opcional)"
                  value={contact.phone}
                  onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
                  placeholder="+56 9 ..."
                  type="tel"
                />
                <div className="md:col-span-2">
                  <LabeledTextArea
                    label="Notas (opcional)"
                    value={contact.notes}
                    onChange={(v) => setContact((c) => ({ ...c, notes: v }))}
                    placeholder="Detalles adicionales para la propuesta."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer de navegación */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === "project"}
              className="border-border bg-background text-foreground hover:bg-border/10 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-[2px] border px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              Volver
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("project")}
                className="border-border bg-background text-muted-foreground hover:bg-border/10 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-[2px] border px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Paso 1
              </button>
              <button
                type="button"
                onClick={() => setStep("details")}
                className="border-border bg-background text-muted-foreground hover:bg-border/10 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-[2px] border px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Paso 2
              </button>
              <button
                type="button"
                onClick={() => setStep("contact")}
                className="border-border bg-background text-muted-foreground hover:bg-border/10 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-[2px] border px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Paso 3
              </button>
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={
                step === "contact" ||
                (projectType === "single" &&
                  (tracks < 12 || tracks > MAX_TRACKS))
              }
              className="border-border bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-[2px] border px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
            {step === "contact" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="border-border bg-card text-foreground hover:bg-border/20 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-2 rounded-[2px] border px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar (placeholder)"}
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {infoModal ? (
        <InfoModal data={infoModal} onClose={() => setInfoModal(null)} />
      ) : null}
    </TooltipProvider>
  );
}

function ProjectCard({
  title,
  description,
  active,
  onSelect,
}: {
  title: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background flex h-full flex-col items-start gap-2 rounded-[2px] border px-4 py-4 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        active
          ? "border-foreground/50 bg-foreground/10 text-foreground"
          : "border-border bg-background text-foreground hover:border-border/70 hover:bg-border/10",
      )}
    >
      <span className="text-base font-semibold">{title}</span>
      <span className="text-muted-foreground text-sm">{description}</span>
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background h-9 rounded-[2px] border px-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background w-full rounded-[2px] border px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </label>
  );
}

function formatCurrency(value: number, currency: Currency) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(value);
}

function addonLabel(key: keyof typeof addons) {
  switch (key) {
    case "acapella":
      return `Acapella (+$${addons.acapella.toLocaleString("es-CL")})`;
    case "instrumental":
      return `Instrumental (+$${addons.instrumental.toLocaleString("es-CL")})`;
    case "liveBacking":
      return `Backing track live (+$${addons.liveBacking.toLocaleString("es-CL")})`;
    case "rush":
      return `Entrega rápida (2 días hábiles) (+$${addons.rush.toLocaleString("es-CL")})`;
    case "unlimitedRevs":
      return `Revisiones ilimitadas (+$${addons.unlimitedRevs.toLocaleString("es-CL")})`;
    default:
      return "";
  }
}

function InfoIconWithTooltip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="border-border bg-background text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-6 w-6 items-center justify-center rounded-full border transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={label}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={4}
        className="border-border bg-card text-foreground rounded-[2px] border shadow-sm"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function InfoModal({
  data,
  onClose,
}: {
  data: { title: string; description: string; video: string };
  onClose: () => void;
}) {
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={handleOverlayClick}
    >
      <div
        className="border-border bg-card w-full max-w-xl rounded-[2px] border p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
              Detalle del servicio
            </p>
            <h3 className="text-foreground text-lg font-semibold">
              {data.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-8 w-8 items-center justify-center rounded-[2px] border transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-border bg-background overflow-hidden rounded-[2px] border">
          <div className="bg-background/60 aspect-video w-full">
            <iframe
              title={data.title}
              src={data.video}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">{data.description}</p>
      </div>
    </div>
  );
}

const infoData: Record<
  string,
  { title: string; description: string; video: string }
> = {
  tracksBase: {
    title: "Precio base por tracks",
    description:
      "Calculamos desde 12 tracks. Cada pista adicional suma un costo fijo para cubrir routing, limpieza y balance inicial.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  drumQuantize: {
    title: "Cuantización de batería",
    description:
      "Alineamos golpes clave manteniendo dinámica y naturalidad. Si el kit está muy fuera de tiempo, recomendamos enviar referencias.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  vocal: {
    title: "Edición/Afinación manual de voz",
    description:
      "Corrección manual (afinación y timing) por pista vocal. Ideal para leads y coros principales; no modifica otros instrumentos.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  acapella: {
    title: "Acapella",
    description:
      "Entrega del mix sin instrumentales para uso en ediciones, remixes o sincronía puntual.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  instrumental: {
    title: "Instrumental",
    description:
      "Versión sin voces para usos alternativos (sync, live backings, stems parciales).",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  liveBacking: {
    title: "Backing track para vivo",
    description:
      "Pista lista para presentaciones en vivo con balance y padding adecuados.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  rush: {
    title: "Entrega rápida (2 días hábiles)",
    description:
      "Priorizamos tu proyecto para entrega en 2 días hábiles. Sujeto a agenda y disponibilidad.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  unlimitedRevs: {
    title: "Revisiones ilimitadas",
    description:
      "Incluye revisiones sin tope durante la ventana de trabajo, partiendo de 3 por defecto.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
};
