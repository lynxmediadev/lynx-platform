"use client";

import * as React from "react";

import { updateCreative } from "@/app/admin/track/actions/update-creative";
import CreativeForm from "@/components/admin/track/CreativeForm";
import { ModuleSaveBar } from "@/components/admin/track/edit/ModuleSaveBar";

type UpdateCreativeResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function CreativeModuleForm({
  track,
  moodCatalog,
  useCatalog,
  categoryCatalog,
}: {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    isDraft: boolean;
    coverUrl: string | null;
    bpm: number | null;
    key: string | null;
    trackType: string | null;
    genres: string[];
    subgenres: string[];
    assignedMoods: string[];
    assignedUses: string[];
    assignedCategories: Array<{ id?: string; slug?: string; name: string }>;
  };
  moodCatalog: { id: string; slug: string; name: string }[];
  useCatalog: { id: string; slug: string; name: string }[];
  categoryCatalog: { id: string; slug: string; name: string }[];
}) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<UpdateCreativeResult | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateCreative(formData);
      setStatus(result);
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("[CreativeModuleForm] handleSubmit error:", error);
      setStatus({
        ok: false,
        message: "Error al guardar modulo creativo.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <input type="hidden" name="id" value={track.id} />

      <div className="space-y-4">
        <CreativeForm
          track={track}
          fieldErrors={fieldErrors}
          moodCatalog={moodCatalog}
          useCatalog={useCatalog}
          categoryCatalog={categoryCatalog}
          categoryError={fieldErrors.catalogTags?.join(", ")}
        />
      </div>

      <ModuleSaveBar
        status={status}
        hint="Guarda titulo, artista y metadata musical de este modulo."
        pending={pending}
        submitLabel="Guardar creativo"
      />
    </form>
  );
}
