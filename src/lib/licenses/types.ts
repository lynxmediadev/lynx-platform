export type TrackLicenseDialogTab = "summary" | "agreement";

export type LicenseSummaryItem = {
  label: string;
  value: string;
};

export type LicenseTermRow = {
  label: string;
  value: string;
};

export type TrackLicenseViewModel = {
  id: string;
  templateId: string;
  name: string;
  isPopular: boolean;
  priceAmount: number | null;
  currency: "CLP" | "USD" | "EUR";
  formats: string[];
  summaryItems: LicenseSummaryItem[];
  termRows: LicenseTermRow[];
  agreementText: string;
  notes: string | null;
  source: "assignment" | "owner-fallback" | "global-fallback" | "legacy-fallback";
  sortOrder: number;
};
