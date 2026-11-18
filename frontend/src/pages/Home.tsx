/** Accueil (§7) : accroche, démo en un clic, les quatre humeurs, le programme des concerts. */
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import HeroScene from "../components/HeroScene";
import AsciiMarket from "../components/ui/AsciiMarket";
import MoodArt from "../components/ui/MoodArt";
import GlitchText from "../components/ui/GlitchText";
import { Barcode, Receipt, Row, Sep } from "../components/ui/Receipt";
import { HERO_PRESET_ID, REGIME_COLORS } from "../config/constants";
import { EPISODES } from "../content/history";
import { MOODS } from "../content/method";
import { fetchPresets } from "../lib/api";
import type { Preset } from "../types/symphony";

const WORDS = ["respirer.", "s'emballer.", "douter.", "s'effondrer.", "renaître."];

/** Ruban défilant entre deux sections : les quatre humeurs, en grand. */
function Ribbon() {
  const items = ["calme", "haussier", "nerveux", "panique"].flatMap((w, i) => [
    <span key={`w${i}`} className={`ribbon-word r-${i}`}>{w}</span>,
    <span key={`s${i}`} className="ribbon-sep">♪</span>,
  ]);
  return (
    <div className="ribbon" aria-hidden="true">
      <div className="ribbon-track">
        {items}
        {items}
        {items}
      </div>
    </div>
  );
}

const STEPS = [
  {
    art: `  ┌──────┐
  │ $$$$ │ ──►
  └──────┘`,
    title: "Le marché parle",
    text: "Chaque séance de Bourse laisse une trace : un prix d'ouverture, de clôture, un volume. Des millions de chiffres, muets.",
  },
  {
    art: `   ( ◉ ◉ )
  ─┤ HMM ├─►
   └─────┘`,
    title: "L'IA écoute",
    text: "Un modèle d'apprentissage automatique reconnaît, jour après jour, l'humeur du marché : calme, haussier, nerveux ou en panique.",
  },
  {
    art: `  ♪ ♫ ♪ ♫
  ▁▃▅▇▅▃▁
  ◦ ○ ◯ ○ ◦`,
    title: "Vous entendez",
    text: "Chaque jour devient une note, chaque humeur une ambiance. Les krachs s'entendent, la sérénité se voit.",
  },
];

export default function Home() {
  const [presets, setPresets] = useState<Preset[]>([]);
  useEffect(() => {
    const c = new AbortController();
    fetchPresets(c.signal).then(({ data }) => setPresets(data)).catch(() => undefined);
    return () => c.abort();
  }, []);
  const ticketNo = String(new Date().getDate() * 1000 + 929).padStart(6, "0");
  // Mot qui change toutes les 2,4 s (avec effet datamosh à l'entrée)
  const [word, setWord] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="page">
      {/* ------------------------------------------------------------- Accroche */}
      <HeroScene>
        <span className="eyebrow light">Sonification · apprentissage automatique · art génératif</span>
        <h1 className="display">
          <GlitchText text="Écoutez">Écoutez</GlitchText> le marché
          <br />
          <em className="rotator" key={word}>
            {WORDS[word]}
          </em>
        </h1>
        <p className="lead">
          Un siècle de Bourse transformé en <span className="hl">œuvre audiovisuelle</span>. Une IA reconnaît
          l'humeur de chaque séance ; le navigateur la joue comme une partition et la peint comme une toile.
        </p>
        <div className="btn-row">
          <Link className="btn primary glow" to={`/studio?preset=${HERO_PRESET_ID}`}>
            ▶ Écouter le krach de 2008
          </Link>
          <Link className="btn ghost-light" to="/jeu">
            Devine le krach
          </Link>
        </div>
      </HeroScene>

      <Ribbon />

      {/* ---------------------------------------------------------- Trois temps */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Le principe, en trois temps</span>
          <h2 className="title">
            Des chiffres muets à une <em>symphonie</em>
          </h2>
        </div>
        <div className="grid-3 steps">
          {STEPS.map((s, i) => (
            <article className="card step" key={s.title}>
              <span className="step-num">0{i + 1} / 03</span>
              <pre className="ascii" aria-hidden="true">{s.art}</pre>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- Les quatre humeurs */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Les quatre humeurs du marché</span>
          <h2 className="title">
            Chaque régime a sa <em>gamme</em>, sa <em>forme</em>, sa <em>couleur</em>
          </h2>
          <p className="lead">
            Ces quatre états ne sont pas définis à la main : le modèle les a découverts seul dans 26 ans de
            S&amp;P 500, puis nous leur avons donné un nom et une voix.
          </p>
        </div>
        <div className="grid-4">
          {MOODS.map((m) => (
            <article className="card mood" key={m.id} style={{ "--regime": REGIME_COLORS[m.id] } as CSSProperties}>
              <MoodArt regime={m.id} />
              <span className="eyebrow" style={{ color: REGIME_COLORS[m.id] }}>
                {m.label}
              </span>
              <h3>{m.metaphor}</h3>
              <p>{m.description}</p>
              <div className="mood-meta">
                <span className="chip">♪ {m.sound.split(",")[0]}</span>
                <span className="chip">vol. {m.stats.vol}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Programme */}
      <section className="program">
        <div className="section">
          <div className="section-head">
            <span className="eyebrow">Au programme</span>
            <h2 className="title">
              Un siècle de <em>krachs</em>, de bulles et d'euphories
            </h2>
            <p className="lead">
              Huit moments historiques, du Jeudi noir de 1929 aux montagnes russes du Bitcoin. Choisissez une
              ligne du ticket : le Studio vous la joue.
            </p>
          </div>
          <div className="prose">
            <p className="figure">
              « Le marché est un pendule qui oscille éternellement entre l'optimisme et le pessimisme. »
              <small>Formule attribuée à Benjamin Graham</small>
            </p>
            <p>
              Avant de lancer la musique, la page <Link to="/contexte">Contexte</Link> raconte ces épisodes et
              leurs protagonistes ; la page <Link to="/methode">Méthode</Link> ouvre le capot de la machine.
            </p>
          </div>
          <AsciiMarket rows={12} />
        </div>

        <Receipt>
          <div className="r-title r-line">MARKET SYMPHONY</div>
          <div className="r-small r-line">SALLE DES MARCHÉS · NEW YORK · DEPUIS 1792</div>
          <div className="r-small r-line">TICKET N° {ticketNo}</div>
          <Sep />
          {(presets.length ? presets : EPISODES.map((e) => ({ id: e.presetId, name: e.title, start: e.year, end: e.year, ticker: "" }))).map(
            (p, i) => (
              <Link key={p.id} to={`/studio?preset=${p.id}`} style={{ textDecoration: "none" }}>
                <Row i={i + 3} label={p.name} value={`${p.start.slice(0, 4)}`} />
              </Link>
            ),
          )}
          <Sep double />
          <Row i={12} bold label="TOTAL" value="1 siècle" />
          <Row i={13} label="Conseil en investissement" value="0,00 €" />
          <Sep />
          <div className="r-center r-line" style={{ "--i": 14 } as CSSProperties}>
            ♪ MERCI DE VOTRE ÉCOUTE ♪
          </div>
          <Barcode seed={2008} />
          <div className="r-small">*** CONSERVEZ CE TICKET ***</div>
        </Receipt>
      </section>
    </main>
  );
}
