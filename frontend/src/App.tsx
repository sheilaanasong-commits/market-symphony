import { useEffect } from "react";
import { Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { TAPE } from "./content/history";
import About from "./pages/About";
import Context from "./pages/Context";
import Game from "./pages/Game";
import Home from "./pages/Home";
import Studio from "./pages/Studio";

const LINKS = [
  { to: "/", label: "Accueil", end: true },
  { to: "/studio", label: "Studio" },
  { to: "/contexte", label: "Contexte" },
  { to: "/methode", label: "Méthode" },
  { to: "/jeu", label: "Devine le krach" },
];

/** Bandeau boursier défilant (dupliqué pour une boucle sans couture). */
function Tape() {
  const items = TAPE.map((t, i) => (
    <span key={i}>
      <b>{t.label}</b> <span className={t.dir}>{t.value}</span>
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

export default function App() {
  const { pathname } = useLocation();
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
  }, [pathname]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Market Symphony — accueil">
            <span className="brand-mark">♪</span> MARKET SYMPHONY
          </Link>
          <nav className="navlinks" aria-label="Navigation principale">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>
                {l.label}
              </NavLink>
            ))}
          </nav>
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
            <pre>{`┌───────────────────────────┐
│  ♪  MERCI DE VOTRE ÉCOUTE │
│     À BIENTÔT AU STUDIO ♪ │
└───────────────────────────┘`}</pre>
            <div>
              <p>Projet éducatif — pas de conseil en investissement.</p>
              <p>Market Symphony · Sheila Songkana · Aivancity · 2026</p>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
