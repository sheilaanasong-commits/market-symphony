/** Accueil (§7) : accroche, démo en un clic, les quatre humeurs, le programme des concerts. */
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import HeroScene from "../components/HeroScene";
import AsciiMarket from "../components/ui/AsciiMarket";
import GlitchText from "../components/ui/GlitchText";
import MoodArt from "../components/ui/MoodArt";
import { Barcode, Receipt, Row, Sep } from "../components/ui/Receipt";
import { HERO_PRESET_ID, REGIME_COLORS, type RegimeId } from "../config/constants";
import { MOOD_STATS } from "../content/types";
import { Rich, useI18n } from "../i18n";
import { fetchPresets } from "../lib/api";
import type { Preset } from "../types/symphony";

const REGIMES: RegimeId[] = ["calm", "bull", "nervous", "panic"];

/** Ruban défilant entre deux sections : les quatre humeurs, en grand. */
function Ribbon({ words }: { words: string[] }) {
  const items = words.flatMap((w, i) => [
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

const STEP_ART = [
  `  ┌──────┐
  │ $$$$ │ ──►
  └──────┘`,
  `   ( ◉ ◉ )
  ─┤ HMM ├─►
   └─────┘`,
  `  ♪ ♫ ♪ ♫
  ▁▃▅▇▅▃▁
  ◦ ○ ◯ ○ ◦`,
];

export default function Home() {
  const { t } = useI18n();
  const h = t.home;
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
    const id = window.setInterval(() => setWord((w) => w + 1), 2400);
    return () => window.clearInterval(id);
  }, []);
  const pct = (x: number) => `${Math.round(x * 100)} %`;

  return (
    <main className="page">
      {/* ------------------------------------------------------------- Accroche */}
      <HeroScene>
        <span className="eyebrow light">{h.eyebrow}</span>
        <h1 className="display">
          <GlitchText text={h.titleA}>{h.titleA}</GlitchText> {h.titleB}
          <br />
          <em className="rotator" key={word}>
            {h.words[word % h.words.length]}
          </em>
        </h1>
        <p className="lead">
          <Rich text={h.lead} />
        </p>
        <div className="btn-row">
          <Link className="btn primary glow" to={`/studio?preset=${HERO_PRESET_ID}`}>
            {h.ctaListen}
          </Link>
          <Link className="btn ghost-light" to="/jeu">
            {h.ctaGame}
          </Link>
        </div>
      </HeroScene>

      <Ribbon words={h.ribbon} />

      {/* ---------------------------------------------------------- Trois temps */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{h.stepsEyebrow}</span>
          <h2 className="title">
            <Rich text={h.stepsTitle} />
          </h2>
        </div>
        <div className="grid-3 steps">
          {h.steps.map((s, i) => (
            <article className="card step" key={i}>
              <span className="step-num">0{i + 1} / 03</span>
              <pre className="ascii" aria-hidden="true">{STEP_ART[i]}</pre>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- Les quatre humeurs */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{h.moodsEyebrow}</span>
          <h2 className="title">
            <Rich text={h.moodsTitle} />
          </h2>
          <p className="lead">{h.moodsLead}</p>
        </div>
        <div className="grid-4">
          {REGIMES.map((id) => {
            const m = t.moods[id];
            return (
              <article className="card mood" key={id} style={{ "--regime": REGIME_COLORS[id] } as CSSProperties}>
                <MoodArt regime={id} />
                <span className="eyebrow" style={{ color: REGIME_COLORS[id] }}>
                  {m.label}
                </span>
                <h3>{m.metaphor}</h3>
                <p>{m.description}</p>
                <div className="mood-meta">
                  <span className="chip">♪ {m.sound.split(",")[0]}</span>
                  <span className="chip">
                    {t.volShort} {pct(MOOD_STATS[id].vol)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------------- Programme */}
      <section className="program">
        <div className="section">
          <div className="section-head">
            <span className="eyebrow">{h.programEyebrow}</span>
            <h2 className="title">
              <Rich text={h.programTitle} />
            </h2>
            <p className="lead">{h.programLead}</p>
          </div>
          <div className="prose">
            <p className="figure">
              {h.quote}
              <small>{h.quoteAuthor}</small>
            </p>
            <p>
              {h.programLinksA} <Link to="/contexte">{t.nav.context}</Link> {h.programLinksB}{" "}
              <Link to="/methode">{t.nav.method}</Link> {h.programLinksC}
            </p>
          </div>
          <AsciiMarket rows={12} label={t.hud.asciiLabel} />
        </div>

        <Receipt>
          <div className="r-title r-line">{h.receipt.title}</div>
          <div className="r-small r-line">{h.receipt.venue}</div>
          <div className="r-small r-line">
            {h.receipt.ticket} {ticketNo}
          </div>
          <Sep />
          {presets.map((p, i) => (
            <Link key={p.id} to={`/studio?preset=${p.id}`} style={{ textDecoration: "none" }}>
              <Row i={i + 3} label={t.presets[p.id] ?? p.name} value={`${p.start.slice(0, 4)}`} />
            </Link>
          ))}
          <Sep double />
          <Row i={12} bold label={h.receipt.total} value={h.receipt.century} />
          <Row i={13} label={h.receipt.advice} value="0,00 €" />
          <Sep />
          <div className="r-center r-line" style={{ "--i": 14 } as CSSProperties}>
            {h.receipt.thanks}
          </div>
          <Barcode seed={2008} />
          <div className="r-small">{h.receipt.keep}</div>
        </Receipt>
      </section>
    </main>
  );
}
