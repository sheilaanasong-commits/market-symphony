/** Page Contexte : ce qu'est un marché, qui l'anime, et les épisodes historiques sonifiés. */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import AsciiGlyph from "../components/ui/AsciiGlyph";
import GlitchText from "../components/ui/GlitchText";
import { REGIME_COLORS } from "../config/constants";
import { ACTORS, EPISODES } from "../content/history";

export default function Context() {
  return (
    <main className="page">
      {/* ---------------------------------------------------------- Ouverture */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Contexte</span>
          <h1 className="display">
            Le marché, cette <em>foule</em> qui <GlitchText text="chante">chante</GlitchText>.
          </h1>
          <p className="lead">
            Avant d'écouter, il faut savoir qui joue. Un marché financier n'est pas une machine : c'est une
            assemblée de millions d'acteurs dont les espoirs et les craintes se cristallisent, à chaque
            instant, en un prix.
          </p>
        </div>
        <div className="grid-3">
          <article className="card">
            <span className="eyebrow">Qu'est-ce qu'une action ?</span>
            <p>
              Une <strong>part de propriété</strong> d'une entreprise. Son prix reflète ce que les investisseurs
              sont prêts à payer aujourd'hui pour les bénéfices de demain : il mêle donc des faits et des
              anticipations.
            </p>
          </article>
          <article className="card">
            <span className="eyebrow">Pourquoi le S&amp;P 500 ?</span>
            <p>
              Parce qu'il résume à lui seul la santé des grandes entreprises américaines, et qu'il offre un
              siècle d'historique. Avant sa création en 1957, la série est prolongée par un indice
              prédécesseur plus étroit (90 valeurs), ce qui permet d'écouter 1929.
            </p>
          </article>
          <article className="card">
            <span className="eyebrow">Pourquoi des « humeurs » ?</span>
            <p>
              Les marchés alternent de longues phases aux caractéristiques stables — les{" "}
              <strong>régimes</strong>. Comme le climat a ses saisons, la Bourse a ses saisons de sérénité,
              d'euphorie, d'inquiétude et de tempête.
            </p>
          </article>
        </div>
      </section>

      {/* ------------------------------------------------------------- Acteurs */}
      <section className="section" id="acteurs">
        <div className="section-head">
          <span className="eyebrow">L'orchestre</span>
          <h2 className="title">
            Les principaux <em>acteurs</em> des marchés
          </h2>
          <p className="lead">
            Si le marché était un orchestre, voici ses pupitres. Chacun a sa partition ; c'est leur interaction
            qui produit la musique — et, parfois, la cacophonie.
          </p>
        </div>
        <div className="actors-grid">
          {ACTORS.map((a) => (
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
              <p className="figure" style={{ fontSize: "1.05rem" }}>
                {a.metaphor}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Épisodes */}
      <section className="section" id="episodes">
        <div className="section-head">
          <span className="eyebrow">Le répertoire</span>
          <h2 className="title">
            Huit épisodes, huit <em>partitions</em>
          </h2>
          <p className="lead">
            Les chiffres suivis de « données » sont calculés sur les séries mêmes que joue le Studio. Chaque
            épisode se conclut par ce que vous entendrez.
          </p>
          <nav className="toc" aria-label="Épisodes">
            {EPISODES.map((e) => (
              <a key={e.presetId} className="chip" href={`#${e.presetId}`} style={{ "--regime": REGIME_COLORS[e.regime] } as CSSProperties}>
                <span className="dot" /> {e.year}
              </a>
            ))}
          </nav>
        </div>

        <div className="timeline">
          {EPISODES.map((e) => (
            <article className="event" id={e.presetId} key={e.presetId} style={{ "--regime": REGIME_COLORS[e.regime] } as CSSProperties}>
              <div className="event-side">
                <span className="event-year">{e.year}</span>
                <span className="mono muted" style={{ fontSize: "0.75rem" }}>
                  {e.period}
                </span>
                <AsciiGlyph regime={e.regime} rows={4} cols={18} />
                <Link className="btn small primary" to={`/studio?preset=${e.presetId}`}>
                  ▶ Écouter
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
                    <span className="eyebrow">Causes</span>
                    <ul className="prose" style={{ paddingLeft: "1.1rem", gap: "0.3rem", marginTop: "0.5rem" }}>
                      {e.causes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="eyebrow">Protagonistes</span>
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
                  <b>À l'écoute — </b>
                  {e.listen}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="figure">
          L'histoire ne se répète pas, mais elle rime.
          <small>Aphorisme souvent attribué à Mark Twain</small>
        </p>
      </section>
    </main>
  );
}
