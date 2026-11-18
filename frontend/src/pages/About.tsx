/** Page Méthode : quoi, comment, pourquoi — le pipeline, les modèles, les outils, les limites, le lexique. */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import GlitchText from "../components/ui/GlitchText";
import MoodArt from "../components/ui/MoodArt";
import { Barcode, Receipt, Row, Sep } from "../components/ui/Receipt";
import { REGIME_COLORS, type RegimeId } from "../config/constants";
import { useContent } from "../content";
import { MOOD_STATS } from "../content/types";
import { Rich, useI18n } from "../i18n";

const REGIMES: RegimeId[] = ["calm", "bull", "nervous", "panic"];

/**
 * Échelle des transitions en ASCII, construite d'après les libellés de la langue.
 * ASCII pur (+ - |) : les caractères de cadre (┌ ─ │) ne sont pas dans la police mono servie par
 * Google Fonts et seraient dessinés par une police de secours de largeur différente.
 */
function transitions(labels: Record<RegimeId, string>, never: string): string {
  const order: RegimeId[] = ["bull", "calm", "nervous", "panic"];
  const names = order.map((id) => labels[id].toUpperCase());
  const edge = names.map((n) => `+${"-".repeat(n.length + 2)}+`).join("      ");
  const mid = names.map((n) => `| ${n} |`).join(" <--> ");
  const left = Math.floor((names[0].length + 4) / 2);
  const right = mid.length - Math.floor((names[3].length + 4) / 2) - 1;
  const arrows = " ".repeat(left) + "^" + " ".repeat(right - left - 1) + "|";
  const label = ` ${never} `;
  const dashes = right - left - 1 - label.length;
  const back = " ".repeat(left) + "+" + "-".repeat(Math.floor(dashes / 2)) + label + "-".repeat(Math.ceil(dashes / 2)) + "+";
  return [edge, mid, edge, arrows, back].map((l) => "   " + l).join("\n");
}

export default function About() {
  const { t } = useI18n();
  const { content, fallback } = useContent();
  const m = content.methodPage;

  return (
    <main className="page">
      {fallback && <p className="fallback-note">{t.pageNotTranslated}</p>}

      {/* ------------------------------------------------------------ Ouverture */}
      <section className="program">
        <div className="section">
          <div className="section-head">
            <span className="eyebrow">{m.eyebrow}</span>
            <h1 className="display">
              <Rich text={m.titleA} /> <GlitchText text={m.titleGlitch}>{m.titleGlitch}</GlitchText>
              {m.titleEnd}
            </h1>
            <p className="lead">{m.lead}</p>
          </div>
          <div className="grid-3">
            {m.what.map((w) => (
              <article className="card" key={w.eyebrow}>
                <span className="eyebrow">{w.eyebrow}</span>
                <p>
                  <Rich text={w.text} />
                </p>
              </article>
            ))}
          </div>
        </div>
        <Receipt>
          <div className="r-title r-line">{m.sheet.title}</div>
          <div className="r-small r-line">{m.sheet.sub}</div>
          <Sep />
          {m.sheet.rows.map(([label, value], i) => (
            <Row key={label} i={i + 2} label={label} value={value} />
          ))}
          <Sep double />
          <Row i={10} bold label={m.sheet.predictions} value="0" />
          <Sep />
          <div className="r-center r-line" style={{ "--i": 11 } as CSSProperties}>
            {m.sheet.motto}
          </div>
          <Barcode seed={42} />
          <div className="r-small">{m.sheet.seed}</div>
        </Receipt>
      </section>

      {/* ------------------------------------------------------------- Pipeline */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{m.pipelineEyebrow}</span>
          <h2 className="title">
            <Rich text={m.pipelineTitle} />
          </h2>
          <p className="lead">{m.pipelineLead}</p>
        </div>
        <div className="pipeline">
          {content.movements.map((mv) => (
            <article className="card movement" key={mv.num}>
              <span className="num">
                {mv.num} · {mv.tempo}
              </span>
              <h3>{mv.title}</h3>
              <p>{mv.text}</p>
              <p className="figure" style={{ fontSize: "1rem" }}>
                {mv.figure}
              </p>
              <code>{mv.tech}</code>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Mesures */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{m.featuresEyebrow}</span>
          <h2 className="title">
            <Rich text={m.featuresTitle} />
          </h2>
          <p className="lead">{m.featuresLead}</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {m.featuresHead.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.features.map((f) => (
                <tr key={f.name}>
                  <td>
                    <strong>{f.name}</strong>
                    <br />
                    <span className="mono muted">{f.col}</span>
                  </td>
                  <td>{f.what}</td>
                  <td>
                    <em>{f.figure}</em>
                  </td>
                  <td>{f.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------- Modèles */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{m.modelsEyebrow}</span>
          <h2 className="title">
            <Rich text={m.modelsTitle} />
          </h2>
          <p className="lead">
            <Rich text={m.modelsLead} />
          </p>
        </div>
        <div className="vs">
          <article className="card">
            <span className="eyebrow">{m.kmeans.eyebrow}</span>
            <h3>{m.kmeans.title}</h3>
            <p>
              <Rich text={m.kmeans.text} />
            </p>
            <p>{m.kmeans.result}</p>
          </article>
          <span className="vs-sep">{m.versus}</span>
          <article className="card" style={{ borderColor: "var(--ink)" }}>
            <span className="eyebrow">{m.hmm.eyebrow}</span>
            <h3>{m.hmm.title}</h3>
            <p>
              <Rich text={m.hmm.text} />
            </p>
            <p>{m.hmm.result}</p>
          </article>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {m.compareHead.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.compareRows.map(([test, km, hmm]) => (
                <tr key={test}>
                  <td>{test}</td>
                  <td>{km}</td>
                  <td>
                    <strong>{hmm}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------ Régimes */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{m.regimesEyebrow}</span>
          <h2 className="title">
            <Rich text={m.regimesTitle} />
          </h2>
          <p className="lead">
            <Rich text={m.regimesLead} />
          </p>
        </div>
        <div className="grid-4">
          {REGIMES.map((id) => {
            const mood = t.moods[id];
            const s = MOOD_STATS[id];
            return (
              <article className="card mood" key={id} style={{ "--regime": REGIME_COLORS[id] } as CSSProperties}>
                <MoodArt regime={id} height={120} />
                <h3>{mood.label}</h3>
                <p className="mono" style={{ fontSize: "0.78rem" }}>
                  {m.statsLine(s.days, s.ret, s.vol)}
                </p>
                <p>
                  <strong>{m.sound} :</strong> {mood.sound}.<br />
                  <strong>{m.image} :</strong> {mood.visual}.
                </p>
              </article>
            );
          })}
        </div>
        <div className="ascii-frame">
          <header>
            <span>{m.matrixTitle}</span>
            <span>HMM · S&amp;P 500</span>
          </header>
          <pre className="ascii matrix" style={{ overflowX: "auto" }}>
            {transitions(Object.fromEntries(REGIMES.map((id) => [id, t.moods[id].label])) as Record<RegimeId, string>, m.matrixNever)}
          </pre>
        </div>
        <div className="prose">
          <p>
            <Rich text={m.matrixText} />
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------- Prédiction */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{m.predictEyebrow}</span>
          <h2 className="title">
            <Rich text={m.predictTitle} />
          </h2>
        </div>
        <div className="grid-2">
          <div className="prose">
            {m.predictParas.map((p, i) => (
              <p key={i}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          <p className="figure">
            {m.predictQuote}
            <small>{m.predictQuoteSource}</small>
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- Outils */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{m.toolsEyebrow}</span>
          <h2 className="title">
            <Rich text={m.toolsTitle} />
          </h2>
          <p className="lead">{m.toolsLead}</p>
        </div>
        <div className="tool-grid">
          {content.tools.map((tool) => (
            <div className="tool" key={tool.name}>
              <span className="layer-tag">{tool.layer}</span>
              <b>{tool.name}</b>
              <span>{tool.role}</span>
              <i>{tool.figure}</i>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- Limites */}
      <section className="grid-2">
        <div className="section">
          <div className="section-head">
            <span className="eyebrow">{m.limitsEyebrow}</span>
            <h2 className="title">
              <Rich text={m.limitsTitle} />
            </h2>
          </div>
          <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
            {m.limits.map((l, i) => (
              <li key={i}>
                <Rich text={l} />
              </li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ alignSelf: "start" }}>
          <span className="eyebrow">{m.disclaimerEyebrow}</span>
          <h3>{m.disclaimerTitle}</h3>
          <p>{m.disclaimerText}</p>
          <Link className="btn small" to="/studio">
            {m.toStudio}
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- Lexique */}
      <section className="section" id="lexique">
        <div className="section-head">
          <span className="eyebrow">{m.glossaryEyebrow}</span>
          <h2 className="title">
            <Rich text={m.glossaryTitle} />
          </h2>
        </div>
        <dl className="glossary">
          {content.glossary.map((g) => (
            <div key={g.term}>
              <dt>{g.term}</dt>
              <dd>{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
