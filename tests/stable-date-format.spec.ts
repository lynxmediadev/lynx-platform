import { describe, expect, it } from "vitest";
import { formatStableSantiagoDateTime } from "../src/lib/stable-date-format";

describe("formato de fecha estable para SSR", () => {
  it("usa una cadena determinista sin espacios dependientes del locale", () => {
    expect(formatStableSantiagoDateTime("2026-09-07T04:42:00.000Z")).toBe(
      "07-09-26, 01:42",
    );
  });

  it("conserva el valor original si no es una fecha válida", () => {
    expect(formatStableSantiagoDateTime("not-a-date")).toBe("not-a-date");
  });
});
