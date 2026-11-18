import { useEffect } from "react";
import { Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { LanguageSwitch, LanguageWelcome } from "./components/LanguagePicker";
import { useI18n, type Lang } from "./i18n";
import About from "./pages/About";
import Context from "./pages/Context";
import Game from "./pages/Game";
import Home from "./pages/Home";
import Studio from "./pages/Studio";

/** Bandeau boursier défilant (dupliqué pour une boucle sans couture). */
function Tape() {
  const { t } = useI18n();
  const items = t.tape.map((x, i) => (
    <span key={i}>
      <b>{x.label}</b> <span className={x.dir}>{x.value}</span>
    </span>
  ));
  return (
    <div className="tape" aria-hidden="true">
      <div className="tape-track">
        {items}
        {items}
      </div>
    </div>
  );
}

/** Cadre ASCII autour de quelques lignes ; les caractères coréens et chinois comptent double. */
function asciiBox(lines: string[]): string {
  const width = (s: string) => [...s].reduce((w, c) => w + (/[ᄀ-ᇿ　-鿿가-힯＀-￯]/.test(c) ? 2 : 1), 0);
  const inner = Math.max(...lines.map(width)) + 2;
  const row = (s: string) => `│ ${s}${" ".repeat(inner - width(s) - 1)}│`;
  return [`┌${"─".repeat(inner)}┐`, ...lines.map(row), `└${"─".repeat(inner)}┘`].join("\n");
}

export default function App() {
  const { pathname } = useLocation();
  const { t, lang } = useI18n();
  // Corps en accolades : dans Chrome récent, scrollTo renvoie une promesse, que React prendrait pour une fonction de nettoyage
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Apparition au défilement : cartes, titres de section, tickets, épisodes
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(
      ".page .card, .page .section-head, .page .receipt-wrap, .page .event, .page .tool, .page .fact",
    );
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((el, i) => {
      el.dataset.reveal = "";
      el.style.setProperty("--rd", String(i % 4));
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname, lang]);

  const links = [
    { to: "/", label: t.nav.home, end: true },
    { to: "/studio", label: t.nav.studio },
    { to: "/contexte", label: t.nav.context },
    { to: "/methode", label: t.nav.method },
    { to: "/jeu", label: t.nav.game },
  ];

  return (
    <div className={`app lang-${lang satisfies Lang}`}>
      <LanguageWelcome />
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label={t.brand.aria}>
            <span className="brand-mark">♪</span>
            <span className="brand-text">
              MARKET SYMPHONY
              <small className="byline">
                {t.brand.by} <b>Sheila SONG KANA</b> · {t.brand.student}
              </small>
            </span>
          </Link>
          <div className="topbar-right">
            <nav className="navlinks" aria-label={t.nav.aria}>
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <LanguageSwitch />
          </div>
        </div>
        <Tape />
      </header>

      {/* La clé relance la transition « datamosh » à chaque changement de page */}
      <div key={pathname} className="mosh-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/contexte" element={<Context />} />
          <Route path="/methode" element={<About />} />
          <Route path="/a-propos" element={<Navigate to="/methode" replace />} />
          <Route path="/jeu" element={<Game />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {pathname !== "/studio" && (
        <footer className="footer">
          <div className="footer-inner">
            <pre>{asciiBox(t.footer.thanks)}</pre>
            <div className="credits">
              <p>
                {t.footer.made} <b>Sheila SONG KANA</b>
              </p>
              <p>{t.footer.school}</p>
              <p>{t.footer.note}</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
