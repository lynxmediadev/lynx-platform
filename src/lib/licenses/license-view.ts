import type {
  LicenseSummaryItem,
  LicenseTermRow,
  TrackLicenseViewModel,
} from "@/lib/licenses/types";

export type LicenseCondition = {
  label: string;
  value: string;
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function buildLookup(license: TrackLicenseViewModel) {
  const rows = [...license.summaryItems, ...license.termRows];
  return rows.map((row) => ({
    key: normalize(row.label),
    value: row.value,
  }));
}

function findByKeywords(
  lookup: Array<{ key: string; value: string }>,
  keywords: string[],
  fallback = "—",
) {
  const found = lookup.find((row) =>
    keywords.some((keyword) => row.key.includes(normalize(keyword))),
  );
  return found?.value ?? fallback;
}

export function formatLicenseAmount(
  amount: number | null,
  currency: "CLP" | "USD" | "EUR",
) {
  if (amount === null || !Number.isFinite(amount)) return "A cotizar";
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export function getLicenseSnapshotConditions(
  license: TrackLicenseViewModel,
): LicenseCondition[] {
  const lookup = buildLookup(license);
  return [
    {
      label: "Precio",
      value: formatLicenseAmount(license.priceAmount, license.currency),
    },
    {
      label: "Formatos",
      value: license.formats.join(", ") || "—",
    },
    {
      label: "Copias de distribución",
      value: findByKeywords(lookup, ["copias", "distribución", "distribution"]),
    },
    {
      label: "Audio streams",
      value: findByKeywords(lookup, ["audio streams", "streams audio", "streaming audio"]),
    },
    {
      label: "Video streams",
      value: findByKeywords(lookup, ["video streams", "streams video"]),
    },
    {
      label: "Videos monetizados",
      value: findByKeywords(lookup, ["videos", "music videos", "monetiz"]),
    },
    {
      label: "Presentaciones en vivo",
      value: findByKeywords(lookup, ["presentaciones", "live performances", "en vivo"]),
    },
    {
      label: "Broadcasting",
      value: findByKeywords(lookup, ["broadcasting", "radio", "tv"]),
    },
  ];
}

export function getLicenseSummaryConditions(
  license: TrackLicenseViewModel,
): LicenseCondition[] {
  const lookup = buildLookup(license);
  return [
    ...getLicenseSnapshotConditions(license),
    {
      label: "Uso comercial",
      value: findByKeywords(lookup, ["uso comercial", "commercial use"]),
    },
    {
      label: "Duración de la licencia",
      value: findByKeywords(lookup, ["duración", "vigencia", "term"]),
    },
    {
      label: "Renovación",
      value: findByKeywords(lookup, ["renovación", "renewal"]),
    },
    {
      label: "Exclusividad",
      value: findByKeywords(lookup, ["exclusiv"]),
    },
  ].slice(0, 12);
}

export function getLicenseMapRows(
  license: TrackLicenseViewModel,
): LicenseTermRow[] {
  if (license.termRows.length >= 12) return license.termRows;

  const enriched: LicenseTermRow[] = [...license.termRows];
  const summary = getLicenseSummaryConditions(license);
  for (const item of summary) {
    if (enriched.some((row) => normalize(row.label) === normalize(item.label))) continue;
    enriched.push({ label: item.label, value: item.value });
  }
  return enriched;
}

export function toSummaryItems(conditions: LicenseCondition[]): LicenseSummaryItem[] {
  return conditions.map((row) => ({ label: row.label, value: row.value }));
}
