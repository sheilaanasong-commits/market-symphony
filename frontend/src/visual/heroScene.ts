/**
 * Scène d'accueil « crépuscule sur les marchés » (canvas 2D).
 *
 * Couches, de l'arrière vers l'avant :
 *   1. ciel dégradé violet → rose → orange, étoiles qui scintillent ;
 *   2. carte du monde en points (masque basse résolution, 64 × 21 cases) ;
 *   3. chandeliers qui défilent : une marche aléatoire qui traverse les 4 régimes
 *      (la panique fait tomber de grosses bougies rouges) + moyenne mobile ;
 *   4. casque audio lumineux, ondes sonores et notes qui s'envolent vers la courbe ;
 *   5. skyline texturée en ASCII néon (Grande Arche, temple boursier), fenêtres qui clignotent ;
 *   6. eau : reflet ondulant de la ville ;
 *   7. atmosphère du régime simulé autour du casque (visual/regimeFx.ts) — lune et ondes, soleil
 *      et notes, éclairs, onde de choc et pluie de caractères — et datamosh pendant la panique.
 *
 * Les couches statiques (ciel, carte, ville) sont dessinées une fois par taille d'écran dans
 * des canevas hors écran ; seul ce qui bouge est redessiné à chaque image.
 * Purement décoratif : ce ne sont pas des données réelles.
 */
import type { RegimeId } from "../config/constants";
import { newFxState, regimeFx } from "./regimeFx";

export interface HeroSceneOptions {
  reducedMotion: boolean;
  onRegime?: (regime: RegimeId, tempo: number) => void;
}

/** Terres émergées : [rangée, colonne début, colonne fin] sur une grille 64 × 21 (équirectangulaire). */
const LAND: [number, number, number][] = [
  [0, 11, 18], [0, 20, 27], [0, 35, 35], [0, 42, 49],
  [1, 3, 21], [1, 22, 27], [1, 35, 63],
  [2, 3, 20], [2, 23, 25], [2, 28, 28], [2, 33, 63],
  [3, 4, 14], [3, 18, 21], [3, 24, 24], [3, 31, 31], [3, 33, 35], [3, 37, 60],
  [4, 9, 21], [4, 30, 31], [4, 32, 56], [4, 60, 60],
  [5, 10, 20], [5, 32, 55], [5, 57, 57],
  [6, 10, 18], [6, 30, 31], [6, 33, 53], [6, 54, 54], [6, 55, 56],
  [7, 11, 17], [7, 30, 53], [7, 55, 55],
  [8, 12, 14], [8, 17, 17], [8, 29, 41], [8, 43, 53],
  [9, 13, 16], [9, 17, 17], [9, 29, 41], [9, 44, 46], [9, 48, 51],
  [10, 16, 16], [10, 29, 39], [10, 45, 45], [10, 49, 51], [10, 53, 53],
  [11, 18, 21], [11, 30, 40], [11, 49, 50], [11, 52, 52], [11, 54, 54],
  [12, 17, 22], [12, 33, 39], [12, 49, 52],
  [13, 17, 25], [13, 34, 39], [13, 50, 58],
  [14, 18, 25], [14, 34, 39], [14, 40, 40], [14, 55, 57],
  [15, 19, 24], [15, 34, 38], [15, 40, 40], [15, 53, 57],
  [16, 19, 23], [16, 34, 37], [16, 52, 59],
  [17, 19, 22], [17, 35, 36], [17, 52, 58],
  [18, 19, 21], [18, 56, 58], [18, 62, 62],
  [19, 19, 20], [19, 58, 58], [19, 61, 61],
  [20, 19, 19],
];

const REGIMES: { id: RegimeId; drift: number; vol: number; len: number; tempo: number }[] = [
  { id: "calm", drift: 0.0002, vol: 0.006, len: 26, tempo: 78 },
  { id: "bull", drift: 0.006, vol: 0.008, len: 30, tempo: 104 },
  { id: "nervous", drift: -0.001, vol: 0.02, len: 22, tempo: 128 },
  { id: "panic", drift: -0.022, vol: 0.035, len: 10, tempo: 158 },
];

const MINT = "#3ee6a8";
const CORAL = "#ff5d7a";
const NEON = ["#ff7ac6", "#7ee8ff", "#b18cff", "#ffd38a", "#5ef0c0"];

interface Candle { o: number; h: number; l: number; c: number }
interface Note { x: number; y: number; vx: number; vy: number; life: number; glyph: string; color: string }
interface Window { x: number; y: number; w: number; h: number; on: boolean; color: string }

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function startHeroScene(canvas: HTMLCanvasElement, { reducedMotion, onRegime }: HeroSceneOptions): () => void {
  const ctx = canvas.getContext("2d")!;
  let W = 0, H = 0, dpr = 1;
  let horizon = 0;
  let sky: HTMLCanvasElement, city: HTMLCanvasElement;
  let windows: Window[] = [];
  let stars: { x: number; y: number; r: number; p: number }[] = [];
  const notes: Note[] = [];
  const fx = newFxState();

  // ------------------------------------------------------------- chandeliers
  const candles: Candle[] = [];
  let regimeIdx = 1;
  let regimeLeft = REGIMES[1].len;
  let price = 100;
  const nextCandle = () => {
    if (--regimeLeft <= 0) {
      regimeIdx = (regimeIdx + 1) % REGIMES.length;
      regimeLeft = REGIMES[regimeIdx].len;
      onRegime?.(REGIMES[regimeIdx].id, REGIMES[regimeIdx].tempo);
    }
    const { drift, vol } = REGIMES[regimeIdx];
    const o = price;
    const c = o * (1 + drift + (Math.random() - 0.5) * 2 * vol);
    const h = Math.max(o, c) * (1 + Math.random() * vol * 0.8);
    const l = Math.min(o, c) * (1 - Math.random() * vol * 0.8);
    price = c;
    candles.push({ o, h, l, c });
  };
  for (let i = 0; i < 46; i++) nextCandle();
  onRegime?.(REGIMES[regimeIdx].id, REGIMES[regimeIdx].tempo);

  const offscreen = (w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    return { c, g };
  };

  // --------------------------------------------------------- couches statiques
  const buildSky = () => {
    const { c, g } = offscreen(W, H);
    const grad = g.createLinearGradient(0, 0, 0, horizon);
    grad.addColorStop(0, "#1f1650");
    grad.addColorStop(0.35, "#4b2a8a");
    grad.addColorStop(0.62, "#9a4aa0");
    grad.addColorStop(0.82, "#e46a8c");
    grad.addColorStop(1, "#ffab73");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, horizon);
    // nuages roses étirés
    g.globalAlpha = 0.35;
    for (let k = 0; k < 9; k++) {
      const y = horizon * rand(0.45, 0.9);
      const x = rand(-0.1, 1) * W;
      const cg = g.createLinearGradient(x, 0, x + W * 0.35, 0);
      cg.addColorStop(0, "rgba(255,150,170,0)");
      cg.addColorStop(0.5, "rgba(255,150,170,0.9)");
      cg.addColorStop(1, "rgba(255,150,170,0)");
      g.fillStyle = cg;
      g.fillRect(x, y, W * 0.35, rand(2, 6));
    }
    g.globalAlpha = 1;
    // carte du monde en points
    const top = H * 0.05, mapH = horizon * 0.78, mapW = W * 0.96, left = W * 0.02;
    const cw = mapW / 64, ch = mapH / 21;
    const step = Math.max(4, Math.min(cw, ch) / 3);
    g.fillStyle = "rgba(214, 205, 255, 0.55)";
    for (const [r, c0, c1] of LAND) {
      for (let x = left + c0 * cw; x < left + (c1 + 1) * cw; x += step) {
        for (let y = top + r * ch; y < top + (r + 1) * ch; y += step) {
          if (Math.random() < 0.9) g.fillRect(x, y, 1.6, 1.6);
        }
      }
    }
    // eau
    const water = g.createLinearGradient(0, horizon, 0, H);
    water.addColorStop(0, "#3a2266");
    water.addColorStop(1, "#140c2e");
    g.fillStyle = water;
    g.fillRect(0, horizon, W, H - horizon);
    sky = c;
  };

  const buildCity = () => {
    const { c, g } = offscreen(W, horizon);
    windows = [];
    g.font = `${Math.max(8, Math.round(H / 70))}px "JetBrains Mono", monospace`;
    const cell = Math.max(7, Math.round(H / 75));

    const building = (x: number, w: number, h: number, neon: string, spire = false) => {
      const y = horizon - h;
      const body = g.createLinearGradient(0, y, 0, horizon);
      body.addColorStop(0, "#2c1b5e");
      body.addColorStop(1, "#160d33");
      g.fillStyle = body;
      g.fillRect(x, y, w, h);
      // texture ASCII néon sur l'arête et en trame
      g.fillStyle = neon;
      g.globalAlpha = 0.5;
      for (let yy = y + cell; yy < horizon; yy += cell) {
        g.fillText("│", x - 1, yy);
        g.fillText("│", x + w - cell * 0.6, yy);
      }
      g.globalAlpha = 0.14;
      for (let yy = y + cell; yy < horizon; yy += cell) for (let xx = x + cell; xx < x + w - cell; xx += cell) g.fillText(":", xx, yy);
      g.globalAlpha = 1;
      if (spire) {
        g.strokeStyle = neon;
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(x + w / 2, y);
        g.lineTo(x + w / 2, y - h * 0.18);
        g.stroke();
      }
      // fenêtres
      for (let yy = y + cell * 0.8; yy < horizon - cell; yy += cell * 1.3) {
        for (let xx = x + cell * 0.7; xx < x + w - cell * 0.7; xx += cell * 1.1) {
          if (Math.random() < 0.55) windows.push({ x: xx, y: yy, w: cell * 0.45, h: cell * 0.55, on: Math.random() < 0.5, color: Math.random() < 0.6 ? "#ffd38a" : NEON[Math.floor(Math.random() * 3)] });
        }
      }
    };

    // arrière-plan : silhouettes basses
    g.fillStyle = "rgba(40, 24, 86, 0.75)";
    for (let x = 0; x < W; x += rand(18, 40)) g.fillRect(x, horizon - rand(H * 0.02, x < W * 0.45 ? H * 0.05 : H * 0.12), rand(16, 36), H);

    // gratte-ciel (laissent la gauche plus basse pour le titre)
    let x = W * 0.47;
    while (x < W * 0.995) {
      const w = rand(W * 0.022, W * 0.048);
      const tall = x > W * 0.55 && x < W * 0.8;
      const h = tall ? rand(H * 0.16, H * 0.34) : rand(H * 0.07, H * 0.2);
      building(x, w, h, NEON[Math.floor(Math.random() * NEON.length)], tall && Math.random() < 0.4);
      x += w + rand(2, 10);
    }
    for (let k = 0; k < 6; k++) building(W * (0.02 + k * 0.07), rand(W * 0.025, W * 0.04), rand(H * 0.03, H * 0.06), NEON[k % NEON.length]);

    // Grande Arche (cube évidé)
    const ax = W * 0.66, as = H * 0.15, ay = horizon - as;
    g.fillStyle = "rgba(235, 228, 255, 0.92)";
    g.fillRect(ax, ay, as, as);
    g.clearRect(ax + as * 0.16, ay + as * 0.16, as * 0.68, as * 0.84);
    g.fillStyle = "rgba(60, 36, 110, 0.9)";
    g.fillRect(ax + as * 0.16, ay + as * 0.16, as * 0.68, as * 0.84);

    // temple boursier (fronton + colonnes) en ASCII orangé
    const tx = W * 0.5, tw = W * 0.1, th = H * 0.1, ty = horizon - th;
    g.fillStyle = "#2a1650";
    g.fillRect(tx, ty, tw, th);
    g.fillStyle = "#ffab73";
    g.beginPath();
    g.moveTo(tx - tw * 0.05, ty);
    g.lineTo(tx + tw / 2, ty - th * 0.35);
    g.lineTo(tx + tw * 1.05, ty);
    g.closePath();
    g.globalAlpha = 0.85;
    g.fill();
    g.globalAlpha = 1;
    for (let k = 0; k < 6; k++) {
      const cx = tx + tw * (0.08 + k * 0.168);
      for (let yy = ty + cell; yy < horizon; yy += cell) g.fillText("║", cx, yy);
    }

    // arbres
    for (const [cx0, n] of [[0, 7], [W * 0.92, 4]] as const) {
      for (let k = 0; k < n; k++) {
        g.fillStyle = k % 2 ? "#1d3b3a" : "#26204f";
        g.beginPath();
        g.arc(cx0 + k * W * 0.022, horizon - rand(0, H * 0.02), rand(H * 0.025, H * 0.045), 0, Math.PI * 2);
        g.fill();
      }
    }
    city = c;
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, rect.width);
    H = Math.max(320, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizon = H * 0.8;
    stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * horizon * 0.5, r: rand(0.5, 1.4), p: Math.random() * 6 }));
    buildSky();
    buildCity();
  };

  // --------------------------------------------------------------- dessin
  let t = 0;
  let scroll = 0; // décalage horizontal des chandeliers (0 → 1 par bougie)
  const draw = () => {
    const regime = REGIMES[regimeIdx];
    const agitation = regime.id === "panic" ? 1 : regime.id === "nervous" ? 0.6 : regime.id === "bull" ? 0.35 : 0.15;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(sky, 0, 0, W, H);

    // étoiles
    for (const s of stars) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 0.04 + s.p);
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    // chandeliers
    const visible = 40;
    const series = candles.slice(-visible - 1);
    const lo = Math.min(...series.map((k) => k.l));
    const hi = Math.max(...series.map((k) => k.h));
    const cx0 = W * 0.4, cx1 = W * 0.99, cy0 = H * 0.08, cy1 = horizon * 0.86;
    const spacing = (cx1 - cx0) / visible;
    const yOf = (v: number) => cy1 - ((v - lo) / Math.max(hi - lo, 1e-6)) * (cy1 - cy0);
    ctx.save();
    ctx.shadowBlur = 10;
    series.forEach((k, i) => {
      const x = cx0 + (i - scroll) * spacing;
      if (x < cx0 - spacing) return;
      const up = k.c >= k.o;
      const color = up ? MINT : CORAL;
      const fade = Math.min(1, (x - cx0 + spacing) / (spacing * 6)); // apparition douce à gauche
      ctx.globalAlpha = 0.9 * fade;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yOf(k.h));
      ctx.lineTo(x, yOf(k.l));
      ctx.stroke();
      const top = yOf(Math.max(k.o, k.c));
      ctx.fillRect(x - spacing * 0.28, top, spacing * 0.56, Math.max(2, yOf(Math.min(k.o, k.c)) - top));
    });
    // moyenne mobile
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = "#bfe9ff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    series.forEach((_, i) => {
      const win = series.slice(Math.max(0, i - 6), i + 1);
      const ma = win.reduce((s, k) => s + k.c, 0) / win.length;
      const x = cx0 + (i - scroll) * spacing;
      if (i === 0) ctx.moveTo(x, yOf(ma));
      else ctx.lineTo(x, yOf(ma));
    });
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;

    // casque + ondes + notes
    const hx = W * 0.6, hy = horizon * 0.58, hr = Math.min(W, H) * 0.075;
    const beat = Math.sin(t * (0.05 + agitation * 0.18));
    for (let k = 0; k < 3; k++) {
      const phase = ((t * (0.6 + agitation * 1.6)) / 60 + k / 3) % 1;
      ctx.strokeStyle = `rgba(126, 232, 255, ${0.5 * (1 - phase)})`;
      ctx.lineWidth = 1.5;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(hx + side * hr, hy + hr * 0.15, hr * (0.5 + phase * 1.4), side < 0 ? Math.PI * 0.6 : -Math.PI * 0.4, side < 0 ? Math.PI * 1.4 : Math.PI * 0.4);
        ctx.stroke();
      }
    }
    ctx.save();
    ctx.shadowColor = "#7ee8ff";
    ctx.shadowBlur = 18 + beat * 6;
    ctx.lineWidth = hr * 0.16;
    const band = ctx.createLinearGradient(hx - hr, 0, hx + hr, 0);
    band.addColorStop(0, "#7ee8ff");
    band.addColorStop(1, "#b18cff");
    ctx.strokeStyle = band;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.fillStyle = "#1b1240";
      ctx.beginPath();
      ctx.ellipse(hx + side * hr * 0.98, hy + hr * 0.15, hr * 0.26, hr * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = side < 0 ? "#7ee8ff" : "#ff7ac6";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
    if (!reducedMotion && Math.random() < 0.05 + agitation * 0.12) {
      notes.push({
        x: hx + (Math.random() < 0.5 ? -hr : hr), y: hy, vx: rand(0.3, 1.2), vy: -rand(0.4, 1.1), life: 1,
        glyph: ["♪", "♫", "♬", "♩"][Math.floor(Math.random() * 4)], color: NEON[Math.floor(Math.random() * NEON.length)],
      });
    }
    ctx.font = `${Math.round(hr * 0.42)}px "JetBrains Mono", monospace`;
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      n.x += n.vx; n.y += n.vy; n.life -= 0.006;
      if (n.life <= 0) { notes.splice(i, 1); continue; }
      ctx.globalAlpha = n.life;
      ctx.fillStyle = n.color;
      ctx.fillText(n.glyph, n.x, n.y);
    }
    ctx.globalAlpha = 1;

    // atmosphère du régime (dans le ciel, autour du casque)
    regimeFx(ctx, regime.id, { x: hx, y: hy, w: W, h: horizon, t, agitation, scale: Math.max(0.8, Math.min(1.6, H / 480)), motion: reducedMotion ? 0.25 : 1 }, fx);

    // ville + fenêtres
    ctx.drawImage(city, 0, 0, W, horizon);
    for (const w of windows) {
      if (!reducedMotion && Math.random() < 0.002 + agitation * 0.004) w.on = !w.on;
      if (!w.on) continue;
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    // reflet ondulant
    const slice = 2;
    ctx.globalAlpha = 0.32;
    for (let y = horizon; y < H; y += slice) {
      const d = y - horizon;
      const src = horizon - d * 1.15;
      if (src < 0) break;
      const dx = Math.sin(d * 0.18 + t * 0.06) * (1.5 + d * 0.04);
      ctx.drawImage(city, 0, src * dpr, city.width, slice * dpr, dx, y, W, slice);
    }
    ctx.globalAlpha = 1;
    // datamosh pendant la panique : bandes de pixels qui glissent
    if (regime.id === "panic" && !reducedMotion && Math.random() < 0.25) {
      for (let k = 0; k < 3; k++) {
        const y = rand(0, H - 14);
        const hh = rand(3, 14);
        ctx.drawImage(canvas, 0, y * dpr, canvas.width, hh * dpr, rand(-24, 24), y, W, hh);
      }
    }

    // reflets de lumière sur l'eau
    for (let k = 0; k < 14; k++) {
      const y = horizon + 6 + ((k * 37 + t * 0.3) % (H - horizon - 6));
      ctx.fillStyle = `rgba(255, 190, 140, ${0.18 + 0.12 * Math.sin(t * 0.08 + k)})`;
      ctx.fillRect(W * ((k * 0.137) % 1), y, rand(10, 40), 1);
    }
  };

  // --------------------------------------------------------------- boucle
  let raf = 0;
  let last = 0;
  let visible = true;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const dt = Math.min(64, now - (last || now));
    last = now;
    t += dt / 16.7;
    const tempo = REGIMES[regimeIdx].tempo;
    scroll += (dt / 1000) * (tempo / 60) * 0.9; // les bougies défilent au tempo du régime
    while (scroll >= 1) {
      scroll -= 1;
      nextCandle();
      if (candles.length > 200) candles.splice(0, candles.length - 100);
    }
    draw();
  };

  resize();
  draw();
  const ro = new ResizeObserver(() => {
    resize();
    draw();
  });
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);
  if (!reducedMotion) raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
  };
}
