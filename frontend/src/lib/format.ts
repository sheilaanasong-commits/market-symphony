const DATE_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const PRICE_FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const PCT_FMT = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });

export const formatDate = (iso: string) => DATE_FMT.format(new Date(`${iso}T00:00:00`));
export const formatPrice = (value: number) => PRICE_FMT.format(value);
/** Rendement logarithmique → variation en % (exp(r) − 1). */
export const formatReturn = (logReturn: number) => PCT_FMT.format(Math.expm1(logReturn));
export const formatPct = (value: number) => PCT_FMT.format(value).replace("+", "");
