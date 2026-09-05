import {
  ChevronDown,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
} from "lucide-react";

type Props = {
  bpm: number | null;
  musicalKey: string | null;
  duration: string;
  syncAvailable: boolean;
  oneStop: boolean | null;
  mfn: boolean | null;
  genre: string;
  subgenre: string;
  moods: string[];
  uses: string[];
  restrictions: string[];
  exclusiveTerritories: string[];
  restrictedTerritories: string[];
  restrictedIndustries: string[];
  restrictedPlatformsAndBrands: string[];
};

function TagList({
  values,
  empty = "Sin datos",
}: {
  values: string[];
  empty?: string;
}) {
  if (values.length === 0)
    return <p className="text-muted-foreground text-xs">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="border-border bg-background text-foreground rounded-full border px-2 py-0.5 text-xs"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/70 bg-background/60 min-w-0 rounded border px-2.5 py-2">
      <dt className="text-muted-foreground text-[9px] font-semibold tracking-[0.12em] uppercase">
        {label}
      </dt>
      <dd
        className="text-foreground mt-1 truncate text-sm font-semibold"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function Disclosure({
  icon,
  title,
  summary,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-border bg-card/25 rounded-md border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 marker:hidden">
        {icon}
        <span className="text-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          {title}
        </span>
        <span className="text-muted-foreground ml-auto truncate text-xs">
          {summary}
        </span>
        <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 transition group-open:rotate-180" />
      </summary>
      <div className="border-border border-t px-3 py-3">{children}</div>
    </details>
  );
}

export default function TrackContextPanel(props: Props) {
  return (
    <aside className="space-y-2 xl:sticky xl:top-[calc(var(--header-h)+0.75rem)]">
      <section className="border-border bg-card/35 rounded-md border p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-foreground inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
            <SlidersHorizontal className="h-4 w-4" />
            Esencial
          </h2>
          <span
            className={
              props.syncAvailable
                ? "text-xs font-semibold text-emerald-500"
                : "text-xs font-semibold text-amber-500"
            }
          >
            {props.syncAvailable
              ? "Disponible para sync"
              : "Sync bajo revisión"}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-1.5">
          <Fact
            label="BPM"
            value={props.bpm ? String(Math.round(props.bpm)) : "—"}
          />
          <Fact label="Tonalidad" value={props.musicalKey || "—"} />
          <Fact label="Duración" value={props.duration} />
        </dl>
      </section>

      <Disclosure
        icon={<Tags className="h-4 w-4" />}
        title="Perfil creativo"
        summary={
          [props.genre, props.subgenre]
            .filter((value) => value !== "—")
            .join(" · ") || "Sin clasificar"
        }
      >
        <dl className="grid grid-cols-2 gap-2">
          <Fact label="Género" value={props.genre} />
          <Fact label="Subgénero" value={props.subgenre} />
        </dl>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
              Moods
            </p>
            <TagList values={props.moods} empty="Sin moods" />
          </div>
          <div>
            <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
              Usos
            </p>
            <TagList values={props.uses} empty="Sin usos" />
          </div>
        </div>
      </Disclosure>

      <Disclosure
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Derechos y restricciones"
        summary={
          props.restrictions.length > 0
            ? `${props.restrictions.length} restricciones`
            : "Sin alertas"
        }
      >
        <dl className="mb-3 grid grid-cols-2 gap-2">
          <Fact
            label="One-stop"
            value={props.oneStop === null ? "—" : props.oneStop ? "Sí" : "No"}
          />
          <Fact
            label="MFN"
            value={props.mfn === null ? "—" : props.mfn ? "Sí" : "No"}
          />
        </dl>
        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
              Restricciones generales
            </p>
            <TagList
              values={props.restrictions}
              empty="Sin restricciones registradas"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Fact
              label="Territorios exclusivos"
              value={props.exclusiveTerritories.join(", ") || "—"}
            />
            <Fact
              label="Territorios restringidos"
              value={props.restrictedTerritories.join(", ") || "—"}
            />
            <Fact
              label="Industrias restringidas"
              value={props.restrictedIndustries.join(", ") || "—"}
            />
            <Fact
              label="Plataformas / marcas"
              value={props.restrictedPlatformsAndBrands.join(", ") || "—"}
            />
          </div>
        </div>
      </Disclosure>
    </aside>
  );
}
