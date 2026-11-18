/** Page Contexte : ce qu'est un marché, qui l'anime, et les épisodes historiques sonifiés. */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import GlitchText from "../components/ui/GlitchText";
import MoodArt from "../components/ui/MoodArt";
import { REGIME_COLORS } from "../config/constants";
import { useContent } from "../content";
import { Rich, useI18n } from "../i18n";

export default function Context() {
  const { t } = useI18n();
  const { content, fallback } = useContent();
  const c = content.contextPage;

  return (
    <main className="page">
      {fallback && <p className="fallback-note">{t.pageNotTranslated}</p>}

      {/* ---------------------------------------------------------- Ouverture */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{c.eyebrow}</span>
          <h1 className="display">
            <Rich text={c.titleA} /> <GlitchText text={c.titleGlitch}>{c.titleGlitch}</GlitchText>
            {c.titleEnd}
          </h1>
          <p className="lead">{c.lead}</p>
        </div>
        <div className="grid-3">
          {c.cards.map((card) => (
            <article className="card" key={card.eyebrow}>
              <span className="eyebrow">{card.eyebrow}</span>
              <p>
                <Rich text={card.text} />
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Acteurs */}
      <section className="section" id="acteurs">
        <div className="section-head">
          <span className="eyebrow">{c.actorsEyebrow}</span>
          <h2 className="title">
            <Rich text={c.actorsTitle} />
          </h2>
          <p className="lead">{c.actorsLead}</p>
        </div>
        <div className="actors-grid">
          {content.actors.map((a) => (
            <article className="card actor" key={a.name}>
              <span className="role">{a.role}</span>
              <h4>{a.name}</h4>
              <p>{a.text}</p>
              <div className="who">
                {a.examples.map((e) => (
                  <span className="chip" key={e}>
                    {e}
                  </span>
                ))}
              </div>
              <p className="figure" style={{ fontSize: "1.02rem" }}>
                {a.metaphor}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Épisodes */}
      <section className="section" id="episodes">
        <div className="section-head">
          <span className="eyebrow">{c.episodesEyebrow}</span>
          <h2 className="title">
            <Rich text={c.episodesTitle} />
          </h2>
          <p className="lead">{c.episodesLead}</p>
          <nav className="toc" aria-label={c.episodesAria}>
            {content.episodes.map((e) => (
              <a key={e.presetId} className="chip" href={`#${e.presetId}`} style={{ "--regime": REGIME_COLORS[e.regime] } as CSSProperties}>
                <span className="dot" /> {e.year}
              </a>
            ))}
          </nav>
        </div>

        <div className="timeline">
          {content.episodes.map((e) => (
            <article className="event" id={e.presetId} key={e.presetId} style={{ "--regime": REGIME_COLORS[e.regime] } as CSSProperties}>
              <div className="event-side">
                <span className="event-year">{e.year}</span>
                <span className="mono muted" style={{ fontSize: "0.75rem" }}>
                  {e.period}
                </span>
                <div className="event-art">
                  <MoodArt regime={e.regime} height={96} />
                </div>
                <Link className="btn small primary" to={`/studio?preset=${e.presetId}`}>
                  {c.listenButton}
                </Link>
              </div>
              <div className="event-body">
                <h3>{e.title}</h3>
                <p>{e.summary}</p>
                <div className="facts">
                  {e.facts.map((f) => (
                    <div className="fact" key={f.label}>
                      <b>{f.value}</b>
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="grid-2">
                  <div>
                    <span className="eyebrow">{c.causes}</span>
                    <ul className="prose" style={{ paddingLeft: "1.1rem", gap: "0.3rem", marginTop: "0.5rem" }}>
                      {e.causes.map((cause) => (
                        <li key={cause}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="eyebrow">{c.protagonists}</span>
                    <div className="who" style={{ marginTop: "0.6rem" }}>
                      {e.actors.map((a) => (
                        <span className="chip" key={a}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="listen">
                  <b>{c.listenLabel}</b>
                  {e.listen}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="figure">
          {c.quote}
          <small>{c.quoteAuthor}</small>
        </p>
      </section>
    </main>
  );
}
