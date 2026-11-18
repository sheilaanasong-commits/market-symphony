/**
 * Petits tableaux génératifs, un par humeur de marché (cartes de l'accueil et de la page Méthode).
 * Formes + caractères ASCII, sur un fond teinté de la couleur du régime.
 *
 *   calme    : étang au clair de lune — ondes concentriques, houle de « ~ »
 *   haussier : soleil levant — rayons tournants, notes et étincelles qui montent en spirale
 *   nerveux  : orage — éclairs brisés qui tressaillent, triangles qui clignotent
 *   panique  : explosion — éclats projetés, pluie de caractères, bandes « datamosh »
 */
import { REGIME_COLORS, type RegimeId } from "../config/constants";

interface P { x: number; y: number; vx: number; vy: number; life: number; size: number; a: number; spin: number; glyph?: string }

export interface MoodState { parts: P[]; ripples: { x: number; y: number; r: number }[] }

export const newMoodState = (): MoodState => ({ parts: [], ripples: [] });

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function background(g: CanvasRenderingContext2D, w: number, h: number, color: string, top: string) {
  g.fillStyle = "#fffefb"; // fond opaque : sinon les dégradés translucides s'accumulent d'une image à l'autre
  g.fillRect(0, 0, w, h);
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, rgba(color, 0.1));
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.fillStyle = rgba(color, 0.12);
  for (let x = 6; x < w; x += 12) for (let y = 6; y < h; y += 12) g.fillRect(x, y, 1, 1);
}

function calm(g: CanvasRenderingContext2D, w: number, h: number, t: number, s: MoodState) {
  const c = REGIME_COLORS.calm;
  background(g, w, h, c, "#eef3ff");
  // lune
  const moon = g.createRadialGradient(w * 0.78, h * 0.28, 2, w * 0.78, h * 0.28, h * 0.32);
  moon.addColorStop(0, "rgba(255,255,255,0.95)");
  moon.addColorStop(0.25, rgba(c, 0.18));
  moon.addColorStop(1, rgba(c, 0));
  g.fillStyle = moon;
  g.fillRect(0, 0, w, h);
  // ondes
  if (Math.random() < 0.04) s.ripples.push({ x: rnd(w * 0.15, w * 0.85), y: rnd(h * 0.55, h * 0.85), r: 2 });
  s.ripples = s.ripples.filter((r) => r.r < w * 0.35);
  for (const r of s.ripples) {
    r.r += 0.35;
    g.strokeStyle = rgba(c, 0.5 * (1 - r.r / (w * 0.35)));
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // houle de ~
  g.font = "13px 'JetBrains Mono', monospace";
  for (let line = 0; line < 4; line++) {
    g.fillStyle = rgba(c, 0.25 + line * 0.15);
    for (let x = -10; x < w; x += 11) {
      const y = h * (0.5 + line * 0.12) + Math.sin(x * 0.04 + t * 0.03 + line) * 4;
      g.fillText("~", x + ((t * 0.2 * (line + 1)) % 11), y);
    }
  }
}

function bull(g: CanvasRenderingContext2D, w: number, h: number, t: number, s: MoodState) {
  const c = REGIME_COLORS.bull;
  background(g, w, h, c, "#effcf3");
  const sx = w / 2, sy = h * 1.02;
  // rayons tournants
  g.save();
  g.translate(sx, sy);
  g.rotate(t * 0.004);
  for (let k = 0; k < 16; k++) {
    g.rotate((Math.PI * 2) / 16);
    g.fillStyle = k % 2 ? rgba("#f5c542", 0.16) : rgba(c, 0.12);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-10, -h * 1.2);
    g.lineTo(10, -h * 1.2);
    g.fill();
  }
  g.restore();
  // soleil
  const sun = g.createRadialGradient(sx, sy, 4, sx, sy, h * 0.55);
  sun.addColorStop(0, "#fff6c9");
  sun.addColorStop(0.45, "rgba(250, 204, 21, 0.55)");
  sun.addColorStop(1, "rgba(250, 204, 21, 0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, w, h);
  // notes et étincelles en spirale
  if (Math.random() < 0.35) {
    s.parts.push({ x: sx + rnd(-w * 0.3, w * 0.3), y: h, vx: 0, vy: -rnd(0.5, 1.2), life: 1, size: rnd(9, 15), a: rnd(0, 6), spin: rnd(0.04, 0.09), glyph: Math.random() < 0.4 ? ["♪", "♫", "↑"][Math.floor(Math.random() * 3)] : undefined });
  }
  g.font = "14px 'JetBrains Mono', monospace";
  s.parts = s.parts.filter((p) => p.life > 0);
  for (const p of s.parts) {
    p.a += p.spin;
    p.x += Math.cos(p.a) * 0.8;
    p.y += p.vy;
    p.life -= 0.006;
    const col = p.glyph ? c : Math.random() < 0.5 ? "#f5b80b" : c;
    g.fillStyle = rgba(col, Math.min(1, p.life * 1.4));
    if (p.glyph) g.fillText(p.glyph, p.x, p.y);
    else {
      g.beginPath();
      g.arc(p.x, p.y, p.size * 0.18, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function nervous(g: CanvasRenderingContext2D, w: number, h: number, t: number, s: MoodState) {
  const c = REGIME_COLORS.nervous;
  background(g, w, h, c, "#fff3ea");
  // éclairs brisés superposés
  const seed = Math.floor(t / 4);
  for (let layer = 0; layer < 3; layer++) {
    g.strokeStyle = rgba(c, 0.25 + layer * 0.3);
    g.lineWidth = layer === 2 ? 2 : 1;
    g.beginPath();
    let y = h * 0.55;
    for (let x = 0; x <= w; x += w / 18) {
      const j = Math.sin((x + seed * 37 + layer * 91) * 12.9898) * 43758.5453;
      y = Math.min(h * 0.85, Math.max(h * 0.2, y + ((j - Math.floor(j)) - 0.5) * h * 0.35));
      if (x === 0) g.moveTo(x, y + layer * 4);
      else g.lineTo(x, y + layer * 4);
    }
    g.stroke();
  }
  // triangles qui clignotent
  if (Math.random() < 0.25) s.parts.push({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-0.6, 0.6), vy: rnd(-0.6, 0.6), life: 1, size: rnd(5, 13), a: rnd(0, 6), spin: rnd(-0.1, 0.1) });
  s.parts = s.parts.filter((p) => p.life > 0);
  for (const p of s.parts) {
    p.x += p.vx; p.y += p.vy; p.a += p.spin; p.life -= 0.012;
    if (Math.random() < 0.08) { p.vx = rnd(-1, 1); p.vy = rnd(-1, 1); }
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.a);
    g.fillStyle = rgba(c, p.life * (Math.random() < 0.1 ? 0.2 : 0.75));
    g.beginPath();
    g.moveTo(0, -p.size);
    g.lineTo(p.size * 0.87, p.size * 0.5);
    g.lineTo(-p.size * 0.87, p.size * 0.5);
    g.fill();
    g.restore();
  }
  // secousse glitch
  if (Math.random() < 0.06) {
    const y = rnd(0, h - 12);
    g.drawImage(g.canvas, 0, y * (g.canvas.width / w), g.canvas.width, 12 * (g.canvas.width / w), rnd(-12, 12), y, w, 12);
  }
}

function panic(g: CanvasRenderingContext2D, w: number, h: number, t: number, s: MoodState) {
  const c = REGIME_COLORS.panic;
  background(g, w, h, c, "#fff0f0");
  const cx = w / 2, cy = h * 0.4;
  // onde de choc
  const pulse = (t * 0.02) % 1;
  g.strokeStyle = rgba(c, 0.45 * (1 - pulse));
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, pulse * w * 0.45, 0, Math.PI * 2);
  g.stroke();
  // éclats
  for (let k = 0; k < 3; k++) {
    const a = rnd(0, Math.PI * 2);
    const sp = rnd(1.5, 4);
    s.parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, size: rnd(5, 14), a, spin: rnd(-0.2, 0.2) });
  }
  // pluie de caractères
  if (Math.random() < 0.5) s.parts.push({ x: rnd(0, w), y: -10, vx: rnd(0.2, 0.8), vy: rnd(1.5, 3), life: 1, size: 12, a: 0, spin: 0, glyph: ["#", "%", "!", "*", "×", "▼"][Math.floor(Math.random() * 6)] });
  g.font = "13px 'JetBrains Mono', monospace";
  s.parts = s.parts.filter((p) => p.life > 0 && p.y < h + 20).slice(-260);
  for (const p of s.parts) {
    p.x += p.vx; p.y += p.vy; p.a += p.spin; p.life -= p.glyph ? 0.004 : 0.018;
    if (!p.glyph) { p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.06; }
    g.fillStyle = rgba(c, p.life * 0.85);
    if (p.glyph) { g.fillText(p.glyph, p.x, p.y); continue; }
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.a);
    g.beginPath();
    g.moveTo(0, -p.size);
    g.lineTo(p.size * 0.2, 0);
    g.lineTo(0, p.size * 0.6);
    g.lineTo(-p.size * 0.2, 0);
    g.fill();
    g.restore();
  }
  // datamosh : bandes décalées
  for (let k = 0; k < (Math.random() < 0.2 ? 4 : 1); k++) {
    const y = rnd(0, h - 10);
    const hh = rnd(3, 14);
    g.drawImage(g.canvas, 0, y * (g.canvas.width / w), g.canvas.width, hh * (g.canvas.width / w), rnd(-18, 18), y, w, hh);
  }
}

export const MOOD_ART: Record<RegimeId, (g: CanvasRenderingContext2D, w: number, h: number, t: number, s: MoodState) => void> = { calm, bull, nervous, panic };
