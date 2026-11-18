/**
 * « Devine le krach » (bonus §2.2) : un extrait sans date ni prix, quatre propositions, un score.
 * L'extrait est choisi parmi les passages les plus agités de la période (les plus reconnaissables).
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import RegimeLegend from "../components/RegimeLegend";
import Stage from "../components/Stage";
import AsciiGlyph from "../components/ui/AsciiGlyph";
import GlitchText from "../components/ui/GlitchText";
import { Barcode, Receipt, Row, Sep } from "../components/ui/Receipt";
import { EPISODES } from "../content/history";
import { usePlayer } from "../hooks/usePlayer";
import { fetchPresets, fetchPresetSymphony } from "../lib/api";
import type { Preset, SymphonyDay, SymphonyResponse } from "../types/symphony";

const ROUNDS = 5;
const EXCERPT_DAYS = 100;
const BASE_POINTS = 100;
const SPEED_BONUS = 50; // dégressif : maximal si l'on répond au tout début de l'extrait

interface Round {
  target: Preset;
  options: Preset[];
  data: SymphonyResponse;
  excerpt: SymphonyDay[];
}

interface Result { preset: Preset; correct: boolean; points: number }

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Fenêtre de `len` jours parmi les plus agitées (somme de l'agitation ≥ 85 % du maximum). */
function pickExcerpt(days: SymphonyDay[], len: number): SymphonyDay[] {
  if (days.length <= len) return days;
  const sums: number[] = [];
  let acc = days.slice(0, len).reduce((s, d) => s + d.visual.agitation, 0);
  sums.push(acc);
  for (let s = 1; s + len <= days.length; s++) {
    acc += days[s + len - 1].visual.agitation - days[s - 1].visual.agitation;
    sums.push(acc);
  }
  const max = Math.max(...sums);
  const candidates = sums.flatMap((v, s) => (v >= 0.85 * max ? [s] : []));
  const start = candidates[Math.floor(Math.random() * candidates.length)];
  return days.slice(start, start + len);
}

function rank(score: number): { title: string; text: string } {
  const max = ROUNDS * (BASE_POINTS + SPEED_BONUS);
  const r = score / max;
  if (r >= 0.8) return { title: "Oreille d'or", text: "Vous entendez venir les krachs comme un chef d'orchestre une fausse note." };
  if (r >= 0.5) return { title: "Analyste mélomane", text: "Une oreille fine — encore quelques écoutes et vous déchiffrerez tout le répertoire." };
  if (r >= 0.25) return { title: "Spectateur attentif", text: "Le marché vous murmure ses secrets ; tendez encore un peu l'oreille." };
  return { title: "Touriste de Wall Street", text: "Pas de panique (enfin, si) : la page Contexte vous attend." };
}

export default function Game() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Preset[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [phase, setPhase] = useState<"intro" | "play" | "end">("intro");

  useEffect(() => {
    const c = new AbortController();
    fetchPresets(c.signal)
      .then(({ data }) => setPresets(data))
      .catch((e: Error) => !c.signal.aborted && setError(e.message));
    return () => c.abort();
  }, []);

  const player = usePlayer(round?.excerpt);
  const started = player.playing || player.current > 0;
  const day = round?.excerpt[player.current];

  const loadRound = useCallback(
    async (target: Preset) => {
      setLoading(true);
      setAnswer(null);
      try {
        const { data } = await fetchPresetSymphony(target);
        const decoys = shuffle(presets.filter((p) => p.id !== target.id)).slice(0, 3);
        setRound({ target, data, options: shuffle([target, ...decoys]), excerpt: pickExcerpt(data.days, EXCERPT_DAYS) });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [presets],
  );

  const start = () => {
    const q = shuffle(presets).slice(0, ROUNDS);
    setQueue(q);
    setResults([]);
    setPhase("play");
    void loadRound(q[0]);
  };

  const choose = (p: Preset) => {
    if (!round || answer) return;
    const correct = p.id === round.target.id;
    const progress = round.excerpt.length > 1 ? player.current / (round.excerpt.length - 1) : 1;
    const points = correct ? BASE_POINTS + Math.round(SPEED_BONUS * (1 - progress)) : 0;
    setAnswer(p.id);
    setResults((r) => [...r, { preset: round.target, correct, points }]);
  };

  const next = () => {
    const i = results.length;
    if (i >= queue.length) {
      player.pause();
      setPhase("end");
      return;
    }
    void loadRound(queue[i]);
  };

  const score = results.reduce((s, r) => s + r.points, 0);
  const episode = useMemo(() => EPISODES.find((e) => e.presetId === round?.target.id), [round]);

  // ----------------------------------------------------------------- Intro
  if (phase === "intro") {
    return (
      <main className="page">
        <section className="program">
          <div className="section">
            <span className="eyebrow">Jeu · Devine le krach</span>
            <h1 className="display">
              Fermez les yeux. <em>Quelle</em> <GlitchText text="crise">crise</GlitchText> entendez-vous ?
            </h1>
            <p className="lead">
              {ROUNDS} manches. À chaque fois, un extrait d'une centaine de séances, sans date ni prix : seulement
              la musique et la toile. Quatre propositions, une seule bonne réponse. Plus vous répondez tôt, plus
              vous marquez de points.
            </p>
            <div className="btn-row">
              <button className="btn primary" onClick={start} disabled={presets.length < 4}>
                ▶ Commencer la partie
              </button>
              <Link className="btn" to="/contexte">
                Réviser le contexte
              </Link>
            </div>
            {error && <p className="error">⚠ {error}</p>}
          </div>
          <div className="grid-2">
            {(["panic", "nervous", "bull", "calm"] as const).map((r) => (
              <div className="ascii-frame" key={r}>
                <AsciiGlyph regime={r} rows={6} cols={22} />
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  // ------------------------------------------------------------------- Fin
  if (phase === "end") {
    const { title, text } = rank(score);
    return (
      <main className="page">
        <section className="program">
          <div className="section">
            <span className="eyebrow">Partie terminée</span>
            <h1 className="display">
              <em>{title}</em>
            </h1>
            <p className="lead">{text}</p>
            <div className="btn-row">
              <button className="btn primary" onClick={start}>
                ↻ Rejouer
              </button>
              <Link className="btn" to="/studio">
                Écouter en entier au Studio
              </Link>
            </div>
          </div>
          <Receipt>
            <div className="r-title r-line">DEVINE LE KRACH</div>
            <div className="r-small r-line">REÇU DE PARTIE</div>
            <Sep />
            {results.map((r, i) => (
              <Row key={i} i={i + 2} label={`${r.correct ? "✓" : "✗"} ${r.preset.name}`} value={`+${r.points}`} />
            ))}
            <Sep double />
            <Row i={8} bold label="SCORE" value={`${score} pts`} />
            <Row i={9} label="Bonnes réponses" value={`${results.filter((r) => r.correct).length} / ${ROUNDS}`} />
            <Sep />
            <div className="r-center r-line" style={{ "--i": 10 } as CSSProperties}>
              {title.toUpperCase()}
            </div>
            <Barcode seed={score + 7} />
            <div className="r-small">MERCI D'AVOIR JOUÉ ♪</div>
          </Receipt>
        </section>
      </main>
    );
  }

  // ---------------------------------------------------------------- Manche
  const roundNo = results.length + (answer ? 0 : 1);
  return (
    <main className="page" style={{ gap: "1.5rem" }}>
      <div className="game-bar">
        <span>
          MANCHE {Math.min(roundNo, ROUNDS)} / {ROUNDS}
        </span>
        <div className="progress" aria-hidden="true">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <i key={i} className={results[i] ? (results[i].correct ? "ok" : "ko") : i === results.length ? "now" : ""} />
          ))}
        </div>
        <span>SCORE {score}</span>
      </div>

      <div className="game">
        <div className="game-stage">
          {round && <RegimeLegend regimes={round.data.regimes} current={started ? day?.regime : undefined} />}
          <Stage
            days={round?.excerpt}
            index={player.current}
            started={started}
            hideReadout={!answer}
            ticker={round?.data.ticker}
            idleText={loading ? "CHARGEMENT DE L'EXTRAIT…" : "▶  ÉCOUTEZ L'EXTRAIT"}
          />
          <div className="btn-row">
            <button className="btn primary" onClick={player.toggle} disabled={!round || loading}>
              {player.playing ? "❚❚ Pause" : started ? "▶ Reprendre" : "▶ Écouter l'extrait"}
            </button>
            <span className="hint" style={{ alignSelf: "center" }}>
              séance {player.current + 1} / {round?.excerpt.length ?? "—"}
              {player.audioError && ` · ${player.audioError}`}
            </span>
          </div>
        </div>

        <div className="section" style={{ gap: "1rem" }}>
          <span className="eyebrow">Votre réponse</span>
          <div className="choices" style={{ gridTemplateColumns: "1fr" }}>
            {round?.options.map((p) => {
              const state = answer ? (p.id === round.target.id ? "correct" : p.id === answer ? "wrong" : "") : "";
              return (
                <button key={p.id} className={`choice ${state}`} onClick={() => choose(p)} disabled={!!answer || !started}>
                  {p.name}
                  {answer && <small>{p.start.slice(0, 4)}–{p.end.slice(0, 4)} · {p.ticker}</small>}
                </button>
              );
            })}
          </div>
          {!started && round && <p className="hint">Lancez l'extrait pour débloquer les réponses.</p>}

          {answer && round && (
            <div className="reveal">
              <span className="eyebrow">{answer === round.target.id ? "Bien entendu !" : "Raté…"}</span>
              <h3>{round.target.name}</h3>
              <p className="mono muted" style={{ fontSize: "0.75rem" }}>
                extrait du {round.excerpt[0].date} au {round.excerpt[round.excerpt.length - 1].date}
              </p>
              {episode && <p style={{ color: "var(--ink-2)", fontSize: "0.92rem" }}>{episode.listen}</p>}
              <div className="btn-row">
                <button className="btn primary small" onClick={next}>
                  {results.length >= ROUNDS ? "Voir mon score →" : "Manche suivante →"}
                </button>
                <Link className="btn small" to={`/studio?preset=${round.target.id}`}>
                  Écouter en entier
                </Link>
              </div>
            </div>
          )}
          {error && <p className="error">⚠ {error}</p>}
        </div>
      </div>
    </main>
  );
}
