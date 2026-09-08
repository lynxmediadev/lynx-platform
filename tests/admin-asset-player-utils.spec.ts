import { describe, expect, it } from "vitest";

import {
  adminAssetTypeLabels,
  clampAudioValue,
  formatAudioTime,
} from "../src/components/admin/player/admin-asset-player-utils";

describe("utilidades del reproductor de assets Admin", () => {
  it("limita volumen y progreso al rango reproducible", () => {
    expect(clampAudioValue(-0.2)).toBe(0);
    expect(clampAudioValue(0.42)).toBe(0.42);
    expect(clampAudioValue(2)).toBe(1);
    expect(clampAudioValue(Number.NaN)).toBe(0);
  });

  it("muestra tiempos legibles", () => {
    expect(formatAudioTime(0)).toBe("0:00");
    expect(formatAudioTime(65.9)).toBe("1:05");
    expect(formatAudioTime(3721)).toBe("62:01");
  });

  it("mantiene nombres claros para cada tipo de asset", () => {
    expect(adminAssetTypeLabels.PREVIEW).toBe("Preview");
    expect(adminAssetTypeLabels.MASTER).toBe("Master");
    expect(adminAssetTypeLabels.STEM).toBe("Stem");
    expect(adminAssetTypeLabels.ALTERNATE).toBe("Versión");
    expect(adminAssetTypeLabels.DELIVERABLE).toBe("Entregable");
  });
});
