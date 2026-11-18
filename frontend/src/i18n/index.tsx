/**
 * Multilingue : langue courante, dictionnaires, mise en forme légère des textes.
 *
 *   - six langues d'interface : français, anglais, espagnol, italien, coréen, mandarin ;
 *   - chaque dictionnaire est typé d'après le français : une clé oubliée ne compile pas ;
 *   - choix mémorisé dans le navigateur ; à la première visite, la langue du navigateur est proposée ;
 *   - <html lang> et les formats de dates / nombres suivent la langue.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setFormatLocale } from "../lib/format";
import { en } from "./messages/en";
import { es } from "./messages/es";
import { fr, type Messages } from "./messages/fr";
import { it } from "./messages/it";
import { ko } from "./messages/ko";
import { zh } from "./messages/zh";

export type Lang = "fr" | "en" | "es" | "it" | "ko" | "zh";

export const LANGS: { code: Lang; native: string; flag: string }[] = [
  { code: "fr", native: "Français", flag: "FR" },
  { code: "en", native: "English", flag: "EN" },
  { code: "es", native: "Español", flag: "ES" },
  { code: "it", native: "Italiano", flag: "IT" },
  { code: "ko", native: "한국어", flag: "KO" },
  { code: "zh", native: "中文", flag: "ZH" },
];

const MESSAGES: Record<Lang, Messages> = { fr, en, es, it, ko, zh };
const STORAGE_KEY = "market-symphony:lang";

function storedLang(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && v in MESSAGES ? (v as Lang) : null;
  } catch {
    return null;
  }
}

/** Langue du navigateur si elle est disponible, sinon le français. */
export function browserLang(): Lang {
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.slice(0, 2).toLowerCase();
    if (code in MESSAGES) return code as Lang;
  }
  return "fr";
}

interface I18n {
  lang: Lang;
  t: Messages;
  /** La langue a-t-elle déjà été choisie (sinon : afficher le sélecteur d'accueil) ? */
  chosen: boolean;
  setLang: (lang: Lang) => void;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const initial = storedLang();
  const [lang, setLangState] = useState<Lang>(initial ?? browserLang());
  const [chosen, setChosen] = useState(initial !== null);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setChosen(true);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* navigation privée : le choix vaut pour la session */
    }
  }, []);

  setFormatLocale(MESSAGES[lang].locale); // avant le rendu des enfants : dates et nombres à jour
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, t: MESSAGES[lang], chosen, setLang }), [lang, chosen, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  return v;
}

/**
 * Mise en forme légère d'un texte traduit :
 *   *mot*   → <em> (dégradé dans les titres)     **mot** → <strong>     ==mot== → surligné
 * Chaque langue place ainsi la mise en valeur sur ses propres mots.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("==")) return <span key={i} className="hl">{p.slice(2, -2)}</span>;
        if (p.startsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
