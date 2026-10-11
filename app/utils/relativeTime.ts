const UNITS = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
] as const;

export const formatRelativeTime = (date: Date, locale: string, now: Date) => {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return format.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return format.format(0, "second");
};
