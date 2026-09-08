import { describe, expect, it } from "vitest";
import { becomesCurrentOnUpload, shouldProcessAsset } from "../src/lib/storage/asset-policy";

describe("política de versiones vigentes", () => {
  it("reemplaza el preview público y conserva masters posteriores como historial", () => {
    expect(becomesCurrentOnUpload("PREVIEW", 1)).toBe(true);
    expect(becomesCurrentOnUpload("MASTER", 0)).toBe(true);
    expect(becomesCurrentOnUpload("MASTER", 1)).toBe(false);
  });
  it("solo encola previews y masters vigentes", () => {
    expect(shouldProcessAsset("MASTER", true)).toBe(true);
    expect(shouldProcessAsset("MASTER", false)).toBe(false);
    expect(shouldProcessAsset("STEM", true)).toBe(false);
  });
});
