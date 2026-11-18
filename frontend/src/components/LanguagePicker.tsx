/**
 * Choix de la langue :
 *   - <LanguageWelcome> : fenêtre d'accueil à la première visite (la langue du navigateur est présélectionnée) ;
 *   - <LanguageSwitch> : menu compact dans la barre de navigation, disponible à tout moment.
 */
import { useEffect, useRef } from "react";
import { LANGS, useI18n, type Lang } from "../i18n";
import GlitchText from "./ui/GlitchText";

/** Titre de la fenêtre d'accueil dans chaque langue : on le lit avant d'avoir choisi. */
const WELCOME: Record<Lang, string> = {
  fr: "Choisissez votre langue",
  en: "Choose your language",
  es: "Elige tu idioma",
  it: "Scegli la tua lingua",
  ko: "언어를 선택하세요",
  zh: "请选择语言",
};

export function LanguageWelcome() {
  const { lang, chosen, setLang, t } = useI18n();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  if (chosen) return null;
  return (
    <div className="lang-overlay" role="dialog" aria-modal="true" aria-labelledby="lang-title">
      <div className="lang-card">
        <pre className="ascii lang-ascii" aria-hidden="true">{`♪ ┌─┐ ♫ ┌─┐ ♪ ┌─┐ ♫
  │F│   │E│   │한│   │中│`}</pre>
        <h2 id="lang-title" className="title">
          <GlitchText text={WELCOME[lang]}>{WELCOME[lang]}</GlitchText>
        </h2>
        <p className="lang-sub">{Object.values(WELCOME).filter((w) => w !== WELCOME[lang]).join(" · ")}</p>
        <div className="lang-grid">
          {LANGS.map((l) => (
            <button
              key={l.code}
              ref={l.code === lang ? first : undefined}
              className={`lang-option ${l.code === lang ? "suggested" : ""}`}
              onClick={() => setLang(l.code)}
              lang={l.code}
            >
              <span className="lang-code">{l.flag}</span>
              <span className="lang-name">{l.native}</span>
            </button>
          ))}
        </div>
        <p className="hint">{t.langPicker.subtitle}</p>
      </div>
    </div>
  );
}

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="lang-switch">
      <span className="sr-only">{t.langPicker.label}</span>
      <span aria-hidden="true">◐</span>
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={t.langPicker.label}>
        {LANGS.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.flag} · {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}
