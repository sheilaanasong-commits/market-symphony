/**
 * Marché ASCII animé : une marche aléatoire qui défile de droite à gauche et traverse
 * les quatre régimes (calme → haussier → nerveux → panique → …). Chaque colonne prend la
 * couleur de son régime ; sous la courbe, une trame de points dessine la « colline » des prix.
 * Chaque régime a ses décors, qui défilent avec la courbe (même vocabulaire que les tableaux des
 * humeurs) : vagues « ~ » en calme, notes ♪ et étincelles en haussier, zigzags qui tressaillent en
 * nerveux, pluie de « * # ! » en panique.
 * Purement décoratif : ce ne sont pas des données réelles.
 */
import { useRef } from "react";
import { REGIME_COLORS, type RegimeId } from "../../config/constants";
import { measureColumns, useAnimationClock } from "../../hooks/useAnimationClock";
import { useI18n } from "../../i18n";
import { hash, REGIME_ORDER } from "../../visual/ascii";

interface Point { v: number; regime: RegimeId; id: number }

/** Dérive et agitation de chaque régime (fraction de la hauteur par pas). */
const DYNAMICS: Record<RegimeId, { drift: number; vol: number; length: number }> = {
  calm: { drift: 0, vol: 0.02, length: 50 },
  bull: { drift: 0.012, vol: 0.02, length: 45 },
  nervous: { drift: -0.004, vol: 0.06, length: 40 },
  panic: { drift: -0.03, vol: 0.12, length: 22 },
};

export default function AsciiMarket({ rows = 16, label = "S&P 500 · SIMULATION" }: { rows?: number; label?: string }) {
  const { t } = useI18n();
  const labels = useRef(t.regimes);
  labels.current = t.regimes;
  const pre = useRef<HTMLPreElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const state = useRef({ series: [] as Point[], regimeIdx: 0, left: 50, cols: 0, nextId: 0, tick: 0 });

  const nextPoint = (prev: Point | undefined): Point => {
    const s = state.current;
    if (--s.left <= 0) {
      s.regimeIdx = (s.regimeIdx + 1) % REGIME_ORDER.length;
      s.left = DYNAMICS[REGIME_ORDER[s.regimeIdx]].length;
    }
    const regime = REGIME_ORDER[s.regimeIdx];
    const { drift, vol } = DYNAMICS[regime];
    let v = (prev?.v ?? 0.5) + drift + (Math.random() - 0.5) * 2 * vol;
    v += (0.5 - v) * 0.03; // rappel vers le centre : la courbe reste dans le cadre
    return { v: Math.min(0.97, Math.max(0.03, v)), regime, id: s.nextId++ };
  };

  useAnimationClock(pre, () => {
    const el = pre.current;
    if (!el) return;
    const s = state.current;
    const cols = measureColumns(el);
    if (cols !== s.cols) {
      s.cols = cols;
      while (s.series.length < cols) s.series.push(nextPoint(s.series[s.series.length - 1]));
      s.series = s.series.slice(-cols);
    }
    s.series.push(nextPoint(s.series[s.series.length - 1]));
    s.series.shift();
    const tick = ++s.tick;

    // Rendu : une ligne de texte par rangée, regroupée en <span> par couleur de régime
    const lines: string[] = [];
    for (let r = 0; r < rows; r++) {
      let html = "";
      let run = "";
      let runRegime: RegimeId | null = null;
      const flush = () => {
        if (run) html += runRegime ? `<span style="color:${REGIME_COLORS[runRegime]}">${run}</span>` : run;
        run = "";
      };
      for (let c = 0; c < s.series.length; c++) {
        const p = s.series[c];
        const y = Math.round((1 - p.v) * (rows - 1));
        const prevY = c > 0 ? Math.round((1 - s.series[c - 1].v) * (rows - 1)) : y;
        let ch = " ";
        let colored = false;
        if (r === y) {
          ch = y < prevY ? "/" : y > prevY ? "\\" : "─";
          colored = true;
        } else if (r > y) {
          if (p.regime === "calm" && r - y === 1) {
            ch = (p.id + Math.floor(tick / 3)) % 3 === 0 ? " " : "~"; // la houle sous la courbe
          } else {
            ch = (r + c) % 2 === 0 ? (r - y < 3 ? ":" : "·") : " ";
          }
          colored = r - y < 3;
        } else {
          const above = y - r; // distance au-dessus de la courbe
          const h = hash(p.id * 7 + r);
          switch (p.regime) {
            case "bull": // notes et étincelles qui scintillent au-dessus de la courbe
              if (above <= 3 && h < 0.16) ch = ["♪", "✦", "+", "♫"][Math.floor(h * 25) % 4];
              else if (above <= 5 && hash(p.id + r + Math.floor(tick / 3)) < 0.05) ch = "·";
              break;
            case "nervous": // zigzags qui tressaillent juste au-dessus
              if (above === 1 && hash(p.id * 3 + Math.floor(tick / 2)) < 0.3) ch = hash(p.id + tick) < 0.5 ? "/" : "\\";
              break;
            case "panic": // pluie de caractères qui tombe
              if (h < 0.45 && (r - tick + p.id * 3) % 6 === 0) ch = ["*", "#", "!", "%"][p.id % 4];
              break;
            case "calm":
              if (above === 2 && p.id % 7 === 0) ch = "~";
              break;
          }
          colored = ch !== " ";
        }
        const reg = colored ? p.regime : null;
        if (reg !== runRegime) { flush(); runRegime = reg; }
        run += ch;
      }
      flush();
      lines.push(html);
    }
    el.innerHTML = lines.join("\n");

    const last = s.series[s.series.length - 1];
    const first = s.series[Math.max(0, s.series.length - 20)];
    const change = ((last.v - first.v) / Math.max(first.v, 0.05)) * 100;
    if (status.current) {
      status.current.textContent = `${labels.current[last.regime].label.toUpperCase()} ${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(1)} %`;
      status.current.style.color = REGIME_COLORS[last.regime];
    }
  }, 10);

  return (
    <div className="ascii-frame" aria-hidden="true">
      <header>
        <span>{label}</span>
        <span ref={status} />
      </header>
      <pre ref={pre} className="ascii" style={{ minHeight: `${rows * 1.15}em` }} />
    </div>
  );
}
