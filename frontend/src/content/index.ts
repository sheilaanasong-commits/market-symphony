/**
 * Contenu éditorial selon la langue. Les longues pages (Contexte, Méthode) existent en français
 * et en anglais ; les autres langues reçoivent l'anglais, avec `fallback: true` pour l'annoncer.
 */
import { useI18n } from "../i18n";
import { enContent } from "./en";
import { frContent } from "./fr";
import type { Content } from "./types";

export function useContent(): { content: Content; fallback: boolean } {
  const { lang } = useI18n();
  if (lang === "fr") return { content: frContent, fallback: false };
  return { content: enContent, fallback: lang !== "en" };
}
