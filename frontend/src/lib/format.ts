/**
 * Formats de dates, prix et pourcentages — ils suivent la langue choisie (setFormatLocale,
 * appelé par I18nProvider à chaque changement de langue).
 */
let DATE_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
let PRICE_FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
let DAY_MONTH_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
let PCT_FMT = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });
let current = "fr-FR";

export function setFormatLocale(locale: string): void {
  if (locale === current) return;
  current = locale;
  DATE_FMT = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  DAY_MONTH_FMT = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  PRICE_FMT = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  PCT_FMT = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });
}

export const formatLocale = () => current;
export const formatDate = (iso: string) => DATE_FMT.format(new Date(`${iso}T00:00:00`));
/** Jour et mois sans l'année (ex. « 15 oct. », « 15 Oct », « 10月15日 »). */
export const formatDayMonth = (iso: string) => DAY_MONTH_FMT.format(new Date(`${iso}T00:00:00`));
export const formatPrice = (value: number) => PRICE_FMT.format(value);
/** Rendement logarithmique → variation en % (exp(r) − 1). */
export const formatReturn = (logReturn: number) => PCT_FMT.format(Math.expm1(logReturn));
export const formatPct = (value: number) => PCT_FMT.format(value).replace("+", "");
export const formatSignedPct = (value: number) => PCT_FMT.format(value);
