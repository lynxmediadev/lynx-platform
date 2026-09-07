const SANTIAGO_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Santiago",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * SSR-safe administrative timestamp. `format()` can emit different whitespace
 * in Node and browsers; joining numeric parts ourselves prevents hydration
 * mismatches while keeping the displayed timezone explicit and stable.
 */
export function formatStableSantiagoDateTime(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return iso;

  const parts = Object.fromEntries(
    SANTIAGO_FORMATTER.formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}-${parts.month}-${parts.year}, ${parts.hour}:${parts.minute}`;
}
