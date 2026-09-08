// src/components/admin/track/CreativeForm.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import SaveStateBadge, { type SaveState } from "../ui/SaveStateBadge";
import EditableIconInput from "@/components/admin/ui/EditableIconInput";
import NumericSelectInput from "@/components/admin/ui/NumericSelectInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoodChips } from "./MoodChips";
import UseChips from "./UseChips";
import CategoryChips from "./CategoryChips";

type FieldErrors = Record<string, string[]>;

type ClientErrors = {
  title?: string | null;
  artist?: string | null;
  bpm?: string | null;
  key?: string | null;
  trackType?: string | null;
  genres?: string | null;
  subgenres?: string | null;
  moods?: string | null;
  uses?: string | null;
};

const NONE_VALUE = "__NONE__";
const TRACK_TYPES = [
  { value: NONE_VALUE, label: "—" },
  { value: "INSTRUMENTAL", label: "Instrumental" },
  { value: "VOCAL", label: "Vocal" },
  { value: "VOCAL_INSTRUMENTAL", label: "Vocal + Instrumental" },
  { value: "OTHER", label: "Otro" },
];
const KEY_SUGGESTIONS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "Cm",
  "C#m",
  "Dbm",
  "Dm",
  "D#m",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gbm",
  "Gm",
  "G#m",
  "Abm",
  "Am",
  "A#m",
  "Bbm",
  "Bm",
];

type CreativeFormProps = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    bpm: number | null;
    key: string | null;
    trackType: string | null;
    genres: string[];
    subgenres: string[];
    assignedMoods: string[];
    assignedUses: string[];
    assignedCategories: Array<{ id?: string; slug?: string; name: string }>;
  };
  fieldErrors?: FieldErrors;
  moodCatalog: { id: string; slug: string; name: string }[];
  useCatalog: { id: string; slug: string; name: string }[];
  categoryCatalog: { id: string; slug: string; name: string }[];
  categoryError?: string | null;
};

export default function CreativeForm({
  track,
  fieldErrors,
  moodCatalog,
  useCatalog,
  categoryCatalog,
  categoryError,
}: CreativeFormProps) {
  const serverErrors: FieldErrors = fieldErrors ?? {};
  const [titleValue, setTitleValue] = React.useState(track.title ?? "");
  const [artistValue, setArtistValue] = React.useState(track.artist ?? "");
  const [bpmValue, setBpmValue] = React.useState(
    track.bpm === null || track.bpm === undefined ? "" : String(track.bpm),
  );
  const [trackTypeValue, setTrackTypeValue] = React.useState(
    track.trackType ? track.trackType : NONE_VALUE,
  );
  const trackTypeInputValue =
    trackTypeValue === NONE_VALUE ? "" : trackTypeValue;
  const genresDefault = (track.genres ?? []).join("\n");
  const subgenresDefault = (track.subgenres ?? []).join("\n");

  // ⬇⬇⬇ NUEVO: estado de errores en el cliente ⬇⬇⬇
  const [clientErrors, setClientErrors] = React.useState<ClientErrors>({});
  type ModuleKey = "moods" | "uses" | "categories";
  const [savedByModule, setSavedByModule] = React.useState<Record<ModuleKey, SaveState>>({
    moods: "idle",
    uses: "idle",
    categories: "idle",
  });
  const saveTimersRef = React.useRef<Partial<Record<ModuleKey, ReturnType<typeof setTimeout>>>>({});

  const setModuleSaveState = React.useCallback((key: ModuleKey, state: SaveState) => {
    setSavedByModule((prev) => ({ ...prev, [key]: state }));
    const timer = saveTimersRef.current[key];
    if (timer) clearTimeout(timer);
    if (state === "saved" || state === "error") {
      saveTimersRef.current[key] = setTimeout(() => {
        setSavedByModule((prev) => ({ ...prev, [key]: "idle" }));
        delete saveTimersRef.current[key];
      }, 2200);
    }
  }, []);

  React.useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Validación simple lado cliente (mismas reglas que Zod, pero en front)
  function validateField(
    name: keyof ClientErrors,
    value: string,
  ): string | null {
    const trimmed = value.trim();

    if (name === "title" && trimmed.length === 0) {
      return "El título es obligatorio.";
    }

    if (name === "artist" && trimmed.length === 0) {
      return "El artista / proyecto es obligatorio.";
    }

    // if (name === "moods" && trimmed.length === 0) {
    //   return "Debes ingresar al menos un mood.";
    // }

    // if (name === "uses" && trimmed.length === 0) {
    //   return "Debes ingresar al menos un uso recomendado.";
    // }

    return null;
  }

  // Se dispara al salir del campo (onBlur)
  function handleFieldBlur(name: keyof ClientErrors, value: string) {
    const error = validateField(name, value);
    setClientErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }

  return (
    <div className="space-y-3">
      <div className="border-b border-border pb-2">
        <h2 className="text-base font-semibold text-foreground">Creativo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Título, artista y descriptores (moods / usos) para búsquedas rápidas.
        </p>
      </div>

      {/* Fila: Título + Artista */}
      <div className="grid gap-2 md:grid-cols-2">
        <FormField
          htmlFor="title"
          label={"Título"}
          descriptionPosition="below"
          description={<>Nombre interno y/o comercial del track.</>}
          error={clientErrors.title ?? serverErrors.title?.[0] ?? null}
        >
          <EditableIconInput
            id="title"
            name="title"
            required
            value={titleValue}
            onChange={setTitleValue}
            onBlurValue={(value) => handleFieldBlur("title", value)}
            lockOnInit
            inputClassName="w-full text-sm h-9 pr-8"
            placeholder="Nombre del track"
          />
        </FormField>

        <FormField
          htmlFor="artist"
          error={clientErrors.artist ?? serverErrors.artist?.[0] ?? null}
          label={"Artista"}
          descriptionPosition="below"
          description={
            <>Alias o nombre artístico visible para el cliente (si aplica).</>
          }
        >
          <EditableIconInput
            id="artist"
            name="artist"
            value={artistValue}
            onChange={setArtistValue}
            onBlurValue={(value) => handleFieldBlur("artist", value)}
            lockOnInit
            inputClassName="w-full text-sm h-9 pr-8"
            placeholder="Nombre del artista / proyecto"
          />
        </FormField>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Metadata musical</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <FormField
            htmlFor="bpm"
            error={clientErrors.bpm ?? serverErrors.bpm?.[0] ?? null}
            label="BPM"
            descriptionPosition="above"
            description="BPM promedio (admite decimales)."
          >
            <NumericSelectInput
              id="bpm"
              name="bpm"
              step={0.1}
              value={bpmValue}
              onChange={setBpmValue}
              className="w-full text-xs"
              placeholder="Ej: 120"
            />
          </FormField>

          <FormField
            htmlFor="key"
            error={clientErrors.key ?? serverErrors.key?.[0] ?? null}
            label="Tonalidad (Key)"
            descriptionPosition="above"
            description="Ej: C#m, Bb, Am."
          >
            <Input
              id="key"
              name="key"
              type="text"
              list="key-options"
              defaultValue={track.key ?? ""}
              className="w-full text-xs"
              placeholder="Ej: C#m"
            />
            <datalist id="key-options">
              {KEY_SUGGESTIONS.map((key) => (
                <option key={key} value={key} />
              ))}
            </datalist>
          </FormField>
        </div>

        <FormField
          htmlFor="trackType"
          error={clientErrors.trackType ?? serverErrors.trackType?.[0] ?? null}
          label="Tipo de track"
          descriptionPosition="above"
          description="Clasificación principal."
          className="md:col-span-1"
        >
          <input type="hidden" name="trackType" value={trackTypeInputValue} />
          <Select value={trackTypeValue} onValueChange={setTrackTypeValue}>
            <SelectTrigger id="trackType" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACK_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            htmlFor="genres"
            error={clientErrors.genres ?? serverErrors.genres?.[0] ?? null}
            label="Géneros"
            descriptionPosition="above"
            description="Uno por línea (o separados por comas)."
          >
            <Textarea
              id="genres"
              name="genres"
              defaultValue={genresDefault}
              rows={4}
              className="w-full resize-y text-xs"
              placeholder="Ej: Cinematic, Ambient, Hip Hop"
            />
          </FormField>

          <FormField
            htmlFor="subgenres"
            error={clientErrors.subgenres ?? serverErrors.subgenres?.[0] ?? null}
            label="Subgéneros"
            descriptionPosition="above"
            description="Opcional, uno por línea."
          >
            <Textarea
              id="subgenres"
              name="subgenres"
              defaultValue={subgenresDefault}
              rows={4}
              className="w-full resize-y text-xs"
              placeholder="Ej: Dark Ambient, Neo Classical"
            />
          </FormField>
        </div>
      </div>

      {/* Sección: Tags (Moods / Usos / Categorías) */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch mb-2">
        <div className="md:col-span-1 h-full">
          <FormField
          htmlFor="moods"
          label={
              <span className="flex w-full items-center justify-between gap-2">
                <span>Moods</span>
              <SaveStateBadge
                state={savedByModule.moods}
                className={
                  savedByModule.moods === "saved"
                    ? "text-emerald-500"
                    : savedByModule.moods === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
                savingLabel="Guardando"
                savedLabel="Guardado"
                errorLabel="Error"
              />
            </span>
          }
          descriptionPosition="above"
          description={<>Busca y añade moods del catálogo; puedes proponer uno nuevo si no existe.</>}
          error={clientErrors.moods ?? serverErrors.moods?.[0] ?? null}
          className="h-full flex flex-col"
        >
          <MoodChips
            name="moods"
            initialMoods={track.assignedMoods ?? []}
            initialCatalog={moodCatalog}
            trackId={track.id}
            onSaveState={(state) => setModuleSaveState("moods", state)}
            error={clientErrors.moods ?? serverErrors.moods?.[0] ?? null}
          />
        </FormField>
      </div>

        <div className="md:col-span-1 h-full">
          <FormField
            htmlFor="uses"
            label={
              <span className="flex w-full items-center justify-between gap-2">
                <span>Usos previstos</span>
                <SaveStateBadge
                  state={savedByModule.uses}
                  className={
                    savedByModule.uses === "saved"
                      ? "text-emerald-500"
                      : savedByModule.uses === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                  savingLabel="Guardando"
                  savedLabel="Guardado"
                  errorLabel="Error"
                />
              </span>
            }
            descriptionPosition="above"
          description={
            <>Usos separados por comas; ayuda a filtrar por tipo de proyecto.</>
          }
          error={clientErrors.uses ?? serverErrors.uses?.[0] ?? null}
          className="h-full flex flex-col"
        >
          <UseChips
            name="uses"
            initialUses={track.assignedUses ?? []}
            initialCatalog={useCatalog}
            trackId={track.id}
            onSaveState={(state) => setModuleSaveState("uses", state)}
            error={clientErrors.uses ?? serverErrors.uses?.[0] ?? null}
            maxItems={15}
          />
        </FormField>
      </div>

        <div className="md:col-span-1 h-full">
          <FormField
            htmlFor="catalogTags"
            label={
              <span className="flex w-full items-center justify-between gap-2">
                <span>Categorías</span>
                <SaveStateBadge
                  state={savedByModule.categories}
                  className={
                    savedByModule.categories === "saved"
                      ? "text-emerald-500"
                      : savedByModule.categories === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                  savingLabel="Guardando"
                  savedLabel="Guardado"
                  errorLabel="Error"
                />
              </span>
            }
            descriptionPosition="above"
          description={<>Asignar/crear categorías del catálogo (CATALOG).</>}
          error={categoryError ?? null}
          className="h-full flex flex-col"
        >
          <CategoryChips
            trackId={track.id}
            name="catalogTags"
            initialCategories={track.assignedCategories}
            initialCatalog={categoryCatalog}
            onSaveState={(state) => setModuleSaveState("categories", state)}
            error={categoryError ?? null}
            maxItems={10}
          />
        </FormField>
      </div>
      </div>
    </div>
  );
}
