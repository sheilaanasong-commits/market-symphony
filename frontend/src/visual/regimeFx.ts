/**
 * Atmosphères de régime — le vocabulaire visuel des quatre humeurs, partagé par tous les graphiques
 * (toile du Studio, scène d'accueil, jeu). Canvas 2D pur : utilisable aussi dans p5 via `p.drawingContext`.
 *
 *   calme    : lueur de lune, ondes concentriques, vaguelettes « ~ »
 *   haussier : rayons de soleil tournants, étincelles dorées et notes ♪ qui montent en spirale
 *   nerveux  : éclairs brisés qui zèbrent le ciel, triangles qui tressaillent
 *   panique  : onde de choc, pluie de caractères « # % ! * », flash rouge à l'entrée
 *
 * L'effet est centré sur un point (la tête de lecture, le casque…) et s'étend dans la zone w × h.
 */
import { REGIME_COLORS, type RegimeId } from "../config/constants";

const GOLD = "#f5b80b";

interface Particle { x: number; y: number; vx: number; vy: number; life: number; size: number; a: number; spin: number; glyph?: string; color: string }
interface Ripple { x: number; y: number; r: number; max: number }
interface Bolt { pts: [number, number][]; life: number }

export interface FxState {
  parts: Particle[];
  ripples: Ripple[];
  bolts: Bolt[];
  regime?: RegimeId;
  flash: number; // 1 → 0 : flash d'entrée dans un régime
  intensity: number; // fondu d'apparition de l'atmosphère (0 → 1)
}

export const newFxState = (): FxState => ({ parts: [], ripples: [], bolts: [], flash: 0, intensity: 0 });

export interface FxOptions {
  x: number; // centre de l'effet
  y: number;
  w: number; // zone de dessin
  h: number;
  t: number; // horloge (images)
  agitation: number; // [0, 1]
  scale?: number; // taille relative des effets (1 = toile du Studio)
  motion?: number; // 1 = normal, < 1 si l'utilisateur préfère réduire les animations
}

export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const MAX_PARTS = 260;

/** Ajoute l'atmosphère du régime `regime` sur le contexte `g` (à appeler à chaque image). */
export function regimeFx(g: CanvasRenderingContext2D, regime: RegimeId, o: FxOptions, s: FxState): void {
  const k = o.scale ?? 1;
  const m = o.motion ?? 1;
  const c = REGIME_COLORS[regime];
  if (s.regime !== regime) {
    s.regime = regime;
    s.flash = 1;
    s.intensity = 0;
    s.bolts = [];
  }
  s.intensity = Math.min(1, s.intensity + 0.03);
  const I = s.intensity;

  g.save();
  // ---------------------------------------------------------------- fond d'ambiance
  switch (regime) {
    case "calm": {
      const moon = g.createRadialGradient(o.x, o.y, 2, o.x, o.y, 120 * k);
      moon.addColorStop(0, `rgba(255,255,255,${0.55 * I})`);
      moon.addColorStop(0.3, rgba(c, 0.16 * I));
      moon.addColorStop(1, rgba(c, 0));
      g.fillStyle = moon;
      g.fillRect(o.x - 130 * k, o.y - 130 * k, 260 * k, 260 * k);
      if (Math.random() < 0.035 * m) s.ripples.push({ x: o.x, y: o.y, r: 4, max: rnd(70, 140) * k });
      break;
    }
    case "bull": {
      g.translate(o.x, o.y + 40 * k);
      g.rotate(o.t * 0.004 * m);
      for (let i = 0; i < 14; i++) {
        g.rotate((Math.PI * 2) / 14);
        g.fillStyle = i % 2 ? rgba(GOLD, 0.07 * I) : rgba(c, 0.05 * I);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(-9 * k, -220 * k);
        g.lineTo(9 * k, -220 * k);
        g.fill();
      }
      g.restore(); // annule la rotation des rayons
      g.save();
      const sun = g.createRadialGradient(o.x, o.y, 2, o.x, o.y, 90 * k);
      sun.addColorStop(0, `rgba(255, 246, 201, ${0.6 * I})`);
      sun.addColorStop(0.5, `rgba(250, 204, 21, ${0.2 * I})`);
      sun.addColorStop(1, "rgba(250, 204, 21, 0)");
      g.fillStyle = sun;
      g.fillRect(o.x - 100 * k, o.y - 100 * k, 200 * k, 200 * k);
      if (Math.random() < (0.25 + o.agitation * 0.3) * m) {
        const glyph = Math.random() < 0.35 ? ["♪", "♫", "↑", "✦"][Math.floor(Math.random() * 4)] : undefined;
        s.parts.push({ x: o.x + rnd(-30, 30) * k, y: o.y + rnd(-6, 10) * k, vx: 0, vy: -rnd(0.5, 1.3) * m, life: 1, size: rnd(2, 4) * k, a: rnd(0, 6), spin: rnd(0.05, 0.1), glyph, color: glyph ? c : Math.random() < 0.6 ? GOLD : c });
      }
      break;
    }
    case "nervous": {
      if (Math.random() < (0.03 + o.agitation * 0.05) * m) {
        const pts: [number, number][] = [];
        let x = o.x + rnd(-80, 80) * k;
        for (let y = Math.max(0, o.y - 220 * k); y < o.y; y += rnd(10, 22) * k) {
          pts.push([x, y]);
          x += rnd(-16, 16) * k;
        }
        pts.push([o.x, o.y]);
        s.bolts.push({ pts, life: 1 });
      }
      if (Math.random() < 0.3 * m) s.parts.push({ x: o.x + rnd(-40, 40) * k, y: o.y + rnd(-40, 40) * k, vx: rnd(-0.8, 0.8), vy: rnd(-0.8, 0.8), life: 1, size: rnd(4, 9) * k, a: rnd(0, 6), spin: rnd(-0.12, 0.12), color: c });
      break;
    }
    case "panic": {
      const pulse = ((o.t * 0.025 * m) % 1);
      g.strokeStyle = rgba(c, 0.45 * (1 - pulse) * I);
      g.lineWidth = 2 * k;
      g.beginPath();
      g.arc(o.x, o.y, pulse * 160 * k, 0, Math.PI * 2);
      g.stroke();
      if (Math.random() < (0.4 + o.agitation * 0.4) * m) {
        s.parts.push({ x: o.x + rnd(-0.35, 0.35) * o.w, y: rnd(-10, o.y * 0.6), vx: rnd(0.1, 0.6), vy: rnd(1.4, 3) * m, life: 1, size: 12 * k, a: 0, spin: 0, glyph: ["#", "%", "!", "*", "×", "▼"][Math.floor(Math.random() * 6)], color: c });
      }
      break;
    }
  }

  // ------------------------------------------------------------------ ondes (calme)
  g.lineWidth = 1.2;
  s.ripples = s.ripples.filter((r) => r.r < r.max);
  for (const r of s.ripples) {
    r.r += 0.6 * m;
    g.strokeStyle = rgba(REGIME_COLORS.calm, 0.45 * (1 - r.r / r.max) * I);
    g.beginPath();
    g.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
    g.stroke();
  }
  if (regime === "calm") {
    g.font = `${Math.round(12 * k)}px "JetBrains Mono", monospace`;
    g.fillStyle = rgba(c, 0.3 * I);
    for (let i = -3; i <= 3; i++) {
      const x = o.x + i * 16 * k + ((o.t * 0.3 * m) % (16 * k));
      g.fillText("~", x, o.y + 26 * k + Math.sin(o.t * 0.05 + i) * 3);
    }
  }

  // ---------------------------------------------------------------- éclairs (nerveux)
  s.bolts = s.bolts.filter((b) => b.life > 0);
  for (const b of s.bolts) {
    b.life -= 0.06 * m;
    g.strokeStyle = rgba(REGIME_COLORS.nervous, b.life * 0.8);
    g.lineWidth = 1.6 * k;
    g.shadowColor = REGIME_COLORS.nervous;
    g.shadowBlur = 8;
    g.beginPath();
    b.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    g.shadowBlur = 0;
  }

  // --------------------------------------------------------------- particules
  g.font = `${Math.round(13 * k)}px "JetBrains Mono", monospace`;
  if (s.parts.length > MAX_PARTS) s.parts.splice(0, s.parts.length - MAX_PARTS);
  s.parts = s.parts.filter((p) => p.life > 0 && p.y < o.h + 20);
  for (const p of s.parts) {
    p.life -= p.glyph && regime === "panic" ? 0.006 : 0.012;
    if (p.color === GOLD || (p.glyph && "♪♫↑✦".includes(p.glyph))) {
      p.a += p.spin;
      p.x += Math.cos(p.a) * 0.7;
    } else if (!p.glyph) {
      if (Math.random() < 0.08) { p.vx = rnd(-1, 1); p.vy = rnd(-1, 1); }
      p.a += p.spin;
    }
    p.x += p.vx;
    p.y += p.vy;
    g.fillStyle = rgba(p.color, Math.min(1, p.life * 1.3));
    if (p.glyph) {
      g.fillText(p.glyph, p.x, p.y);
    } else if (p.color === GOLD || regime === "bull") {
      g.beginPath();
      g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      g.fill();
    } else {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.a);
      g.beginPath();
      g.moveTo(0, -p.size);
      g.lineTo(p.size * 0.87, p.size * 0.5);
      g.lineTo(-p.size * 0.87, p.size * 0.5);
      g.fill();
      g.restore();
    }
  }

  // ----------------------------------------------------- flash d'entrée de régime
  if (s.flash > 0) {
    s.flash = Math.max(0, s.flash - 0.04 * m);
    const strength = regime === "panic" ? 0.22 : 0.1;
    const v = g.createRadialGradient(o.x, o.y, 10, o.x, o.y, Math.max(o.w, o.h) * 0.7);
    v.addColorStop(0, rgba(c, 0));
    v.addColorStop(1, rgba(c, strength * s.flash));
    g.fillStyle = v;
    g.fillRect(0, 0, o.w, o.h);
  }
  g.restore();
}
