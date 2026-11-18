/**
 * Petits dessins ASCII animés (pure fonction du temps t) — une humeur de marché par régime.
 * Chaque fonction renvoie un bloc de texte de `rows` lignes × `cols` colonnes.
 */
import type { RegimeId } from "../config/constants";

/** Pseudo-aléatoire déterministe (même dessin à chaque rendu pour un même t). */
export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const grid = (rows: number, cols: number) => Array.from({ length: rows }, () => Array<string>(cols).fill(" "));
const join = (g: string[][]) => g.map((r) => r.join("")).join("\n");

/** Calme : une houle tranquille de vaguelettes. */
function calm(t: number, rows: number, cols: number): string {
  const g = grid(rows, cols);
  for (let c = 0; c < cols; c++) {
    const y = (Math.sin(c * 0.35 + t * 0.25) + 1) * 0.5 * (rows - 2) + 0.5;
    const r = Math.round(y);
    g[r][c] = "~";
    if (r + 1 < rows && (c + Math.floor(t / 2)) % 3 === 0) g[r + 1][c] = "·";
  }
  return join(g);
}

/** Haussier : des notes et des flèches qui montent comme des bulles de champagne. */
function bull(t: number, rows: number, cols: number): string {
  const g = grid(rows, cols);
  const glyphs = ["^", "↑", "*", "♪", "+"];
  for (let k = 0; k < Math.floor(cols / 2.5); k++) {
    const c = Math.floor(hash(k) * cols);
    const speed = 0.3 + hash(k + 50) * 0.5;
    const r = rows - 1 - (Math.floor(t * speed + hash(k + 9) * rows * 3) % (rows + 2));
    if (r >= 0 && r < rows) g[r][c] = glyphs[k % glyphs.length];
  }
  return join(g);
}

/** Nerveux : une ligne brisée qui tressaille. */
function nervous(t: number, rows: number, cols: number): string {
  const g = grid(rows, cols);
  let r = Math.floor(rows / 2);
  for (let c = 0; c < cols; c++) {
    const step = hash(c * 7 + Math.floor(t / 2) * 13) > 0.5 ? 1 : -1;
    const next = Math.min(rows - 1, Math.max(0, r + step));
    g[r][c] = next < r ? "/" : "\\";
    r = next;
  }
  return join(g);
}

/** Panique : des éclats qui tombent en pluie oblique. */
function panic(t: number, rows: number, cols: number): string {
  const g = grid(rows, cols);
  const glyphs = ["*", "!", "#", "%", "×", "/", "▼"];
  for (let k = 0; k < Math.floor(cols / 1.6); k++) {
    const speed = 0.6 + hash(k + 3) * 0.9;
    const r = Math.floor(t * speed + hash(k) * rows * 4) % (rows + 3);
    const c = Math.floor(hash(k + 77) * cols + r * 0.6) % cols;
    if (r < rows) g[r][c] = glyphs[(k + Math.floor(t / 3)) % glyphs.length];
  }
  return join(g);
}

export const REGIME_ASCII: Record<RegimeId, (t: number, rows: number, cols: number) => string> = { calm, bull, nervous, panic };

export const REGIME_ORDER: RegimeId[] = ["calm", "bull", "nervous", "panic"];
