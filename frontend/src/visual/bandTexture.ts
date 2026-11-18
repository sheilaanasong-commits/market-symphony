/**
 * Texture animée des bandes de régime (courbe du Studio) : chaque suite de jours d'un même régime
 * est tramée de son motif, dans le même vocabulaire que les tableaux des humeurs.
 *
 *   calme    : « ~ » qui ondulent      haussier : « ↑ ♪ » qui montent
 *   nerveux  : « / \ » qui tressaillent  panique : « * # ! » qui tombent
 *
 * + la tête de lecture : une colonne lumineuse à la couleur du régime courant.
 */
import { REGIME_COLORS, type RegimeId } from "../config/constants";
import { hash } from "./ascii";
import { rgba } from "./regimeFx";

export interface Run { regime: RegimeId; start: number; end: number } // jours [start, end)

export function regimeRuns(regimes: RegimeId[]): Run[] {
  const runs: Run[] = [];
  let start = 0;
  for (let i = 1; i <= regimes.length; i++) {
    if (i < regimes.length && regimes[i] === regimes[start]) continue;
    runs.push({ regime: regimes[start], start, end: i });
    start = i;
  }
  return runs;
}

const CELL = 14;

export function drawBandTexture(g: CanvasRenderingContext2D, w: number, h: number, runs: Run[], n: number, index: number, t: number, started: boolean) {
  g.clearRect(0, 0, w, h);
  if (!n) return;
  g.font = `11px "JetBrains Mono", monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const rows = Math.ceil(h / CELL) + 1;
  for (const run of runs) {
    const x0 = (run.start / n) * w, x1 = (run.end / n) * w;
    const color = REGIME_COLORS[run.regime];
    const playedRun = index >= run.start; // les bandes déjà jouées sont plus présentes
    for (let cx = Math.floor(x0 / CELL) * CELL + CELL / 2; cx < x1; cx += CELL) {
      if (cx < x0) continue;
      const col = Math.round(cx / CELL);
      for (let r = 0; r < rows; r++) {
        const seed = hash(col * 31 + r * 7);
        let x = cx, y = r * CELL + CELL / 2, ch = "", a = 0;
        switch (run.regime) {
          case "calm":
            if ((r + col) % 3) continue;
            ch = "~";
            x += ((t * 0.4) % CELL) - CELL / 2;
            y += Math.sin(t * 0.08 + col * 0.6) * 2;
            a = 0.28;
            break;
          case "bull":
            if (seed > 0.35) continue;
            ch = seed < 0.08 ? "♪" : "↑";
            y = (((r * CELL - t * (0.6 + seed)) % (rows * CELL)) + rows * CELL) % (rows * CELL);
            a = 0.32;
            break;
          case "nervous":
            if (seed > 0.45) continue;
            ch = hash(col + r + Math.floor(t / 6)) > 0.5 ? "/" : "\\";
            x += (hash(col * 3 + Math.floor(t / 3)) - 0.5) * 3;
            a = 0.3;
            break;
          case "panic":
            if (seed > 0.4) continue;
            ch = ["*", "#", "!", "%"][Math.floor(seed * 10) % 4];
            y = (r * CELL + t * (1.2 + seed * 2)) % (rows * CELL);
            a = 0.36;
            break;
        }
        g.fillStyle = rgba(color, a * (playedRun ? 1 : 0.55));
        g.fillText(ch, x, y);
      }
    }
  }
  // Tête de lecture
  if (started) {
    const i = Math.min(index, n - 1);
    const run = runs.find((r) => i >= r.start && i < r.end);
    const color = REGIME_COLORS[run?.regime ?? "calm"];
    const x = ((i + 0.5) / n) * w;
    const glow = g.createLinearGradient(x - 18, 0, x + 18, 0);
    glow.addColorStop(0, rgba(color, 0));
    glow.addColorStop(0.5, rgba(color, 0.28 + 0.12 * Math.sin(t * 0.2)));
    glow.addColorStop(1, rgba(color, 0));
    g.fillStyle = glow;
    g.fillRect(x - 18, 0, 36, h);
    g.fillStyle = rgba(color, 0.9);
    g.fillRect(x - 0.75, 0, 1.5, h);
  }
}
