/**
 * « Devine le krach » (bonus §2.2) : un extrait sans date ni prix, quatre propositions, un score.
 * L'extrait est choisi parmi les passages les plus agités de la période (les plus reconnaissables).
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import RegimeLegend from "../components/RegimeLegend";
import Stage from "../components/Stage";
import MoodArt from "../components/ui/MoodArt";
import { REGIME_COLORS } from "../config/constants";
import GlitchText from "../components/ui/GlitchText";
import { Barcode, Receipt, Row, Sep } from "../components/ui/Receipt";
import { useContent } from "../content";
import { Rich, useI18n } from "../i18n";
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

/** Rang final : indice dans t.game.ranks (0 = meilleur). */
function rankIndex(score: number): number {
  const r = score / (ROUNDS * (BASE_POINTS + SPEED_BONUS));
  return r >= 0.8 ? 0 : r >= 0.5 ? 1 : r >= 0.25 ? 2 : 3;
}

export default function Game() {
  const { t } = useI18n();
  const g = t.game;
  const { content } = useContent();
  const name = (p: Preset) => t.presets[p.id] ?? p.name;
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
  const episode = useMemo(() => content.episodes.find((e) => e.presetId === round?.target.id), [round, content]);

  // ----------------------------------------------------------------- Intro
  if (phase === "intro") {
    return (
      <main className="page">
        <section className="program">
          <div className="section">
            <span className="eyebrow">{g.eyebrow}</span>
            <h1 className="display">
              <GlitchText text={g.title.replace(/\*/g, "")}>
                <Rich text={g.title} />
              </GlitchText>
            </h1>
            <p className="lead">{g.lead(ROUNDS)}</p>
            <div className="btn-row">
              <button className="btn primary" onClick={start} disabled={presets.length < 4}>
                {g.start}
              </button>
              <Link className="btn" to="/contexte">
                {g.review}
              </Link>
            </div>
            {error && <p className="error">⚠ {error}</p>}
          </div>
          <div className="grid-2">
            {(["panic", "nervous", "bull", "calm"] as const).map((r) => (
              <div className="card mood-tile" key={r}>
                <MoodArt regime={r} height={130} />
                <span className="eyebrow" style={{ color: REGIME_COLORS[r] }}>
                  {t.regimes[r].label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  // ------------------------------------------------------------------- Fin
  if (phase === "end") {
    const { title, text } = g.ranks[rankIndex(score)];
    return (
      <main className="page">
        <section className="program">
          <div className="section">
            <span className="eyebrow">{g.over}</span>
            <h1 className="display">
              <em>{title}</em>
            </h1>
            <p className="lead">{text}</p>
            <div className="btn-row">
              <button className="btn primary" onClick={start}>
                {g.replay}
              </button>
              <Link className="btn" to="/studio">
                {g.fullStudio}
              </Link>
            </div>
          </div>
          <Receipt>
            <div className="r-title r-line">{g.receiptTitle}</div>
            <div className="r-small r-line">{g.receiptSub}</div>
            <Sep />
            {results.map((r, i) => (
              <Row key={i} i={i + 2} label={`${r.correct ? "✓" : "✗"} ${name(r.preset)}`} value={`+${r.points}`} />
            ))}
            <Sep double />
            <Row i={8} bold label={g.score} value={`${score} pts`} />
            <Row i={9} label={g.correctAnswers} value={`${results.filter((r) => r.correct).length} / ${ROUNDS}`} />
            <Sep />
            <div className="r-center r-line" style={{ "--i": 10 } as CSSProperties}>
              {title.toUpperCase()}
            </div>
            <Barcode seed={score + 7} />
            <div className="r-small">{g.thanks}</div>
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
          {g.round} {Math.min(roundNo, ROUNDS)} / {ROUNDS}
        </span>
        <div className="progress" aria-hidden="true">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <i key={i} className={results[i] ? (results[i].correct ? "ok" : "ko") : i === results.length ? "now" : ""} />
          ))}
        </div>
        <span>
          {g.score} {score}
        </span>
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
            idleText={loading ? g.loadingExcerpt : g.listenExcerpt}
          />
          <div className="btn-row">
            <button className="btn primary" onClick={player.toggle} disabled={!round || loading}>
              {player.playing ? g.pause : started ? g.resume : g.listen}
            </button>
            <span className="hint" style={{ alignSelf: "center" }}>
              {g.session(player.current + 1, round?.excerpt.length ?? "—")}
              {player.audioError && ` · ${t.studio.audioUnavailable} : ${player.audioError}`}
            </span>
          </div>
        </div>

        <div className="section" style={{ gap: "1rem" }}>
          <span className="eyebrow">{g.yourAnswer}</span>
          <div className="choices" style={{ gridTemplateColumns: "1fr" }}>
            {round?.options.map((p) => {
              const state = answer ? (p.id === round.target.id ? "correct" : p.id === answer ? "wrong" : "") : "";
              return (
                <button key={p.id} className={`choice ${state}`} onClick={() => choose(p)} disabled={!!answer || !started}>
                  {name(p)}
                  {answer && <small>{p.start.slice(0, 4)}–{p.end.slice(0, 4)} · {p.ticker}</small>}
                </button>
              );
            })}
          </div>
          {!started && round && <p className="hint">{g.unlock}</p>}

          {answer && round && (
            <div className="reveal">
              <span className="eyebrow">{answer === round.target.id ? g.right : g.wrong}</span>
              <h3>{name(round.target)}</h3>
              <p className="mono muted" style={{ fontSize: "0.75rem" }}>
                {g.excerpt(round.excerpt[0].date, round.excerpt[round.excerpt.length - 1].date)}
              </p>
              {episode && <p style={{ color: "var(--ink-2)", fontSize: "0.92rem" }}>{episode.listen}</p>}
              <div className="btn-row">
                <button className="btn primary small" onClick={next}>
                  {results.length >= ROUNDS ? g.seeScore : g.next}
                </button>
                <Link className="btn small" to={`/studio?preset=${round.target.id}`}>
                  {g.full}
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
