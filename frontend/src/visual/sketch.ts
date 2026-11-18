/**
 * Art génératif (S5) — sketch p5.js en mode instance.
 *
 * La toile se peint au fil de la période :
 *   - l'axe horizontal est le temps (jour i → x = i / (n − 1)) ;
 *   - chaque nouvelle séance émet des particules à la hauteur de son rendement (visual.y) ;
 *   - le régime fixe la forme et le mouvement :
 *       calme    → cercles qui flottent lentement
 *       haussier → spirales ascendantes
 *       nerveux  → triangles anguleux, trajectoires brisées
 *       panique  → éclats projetés dans tous les sens, attirés vers le bas
 *   - la volatilité (agitation) règle la taille, la vitesse et le nombre de particules ;
 *   - le volume (opacity) règle la luminosité.
 *
 * Les particules laissent une trace très légère sur un calque persistant : à la fin de
 * la lecture, la toile montre toute l'histoire de la période (exportable plus tard en PNG).
 *
 * Datamosh : à chaque changement de régime, des bandes de pixels glissent et s'étirent pendant
 * quelques images, comme une vidéo compressée qui « bave » — la rupture se voit autant qu'elle s'entend.
 *
 * Atmosphère : autour de la tête de lecture, l'ambiance du régime courant (visual/regimeFx.ts) —
 * lune et ondes en calme, soleil et notes en haussier, éclairs en nerveux, onde de choc et pluie
 * de caractères en panique. Les particules reprennent ce vocabulaire (♪, ~, # % ! *).
 *
 * Le sketch ne dépend pas de React : il lit l'état courant via `getFrame()` à chaque image.
 */
import type p5 from "p5";
import { TARGET_FPS } from "../config/constants";
import { newFxState, regimeFx } from "./regimeFx";
import type { SymphonyDay } from "../types/symphony";

export interface SketchFrame {
  days: SymphonyDay[] | undefined;
  index: number; // jour courant
  started: boolean; // lecture commencée : l'atmosphère ne s'allume qu'à ce moment
}

export interface SketchOptions {
  container: HTMLElement;
  getFrame: () => SketchFrame;
  reducedMotion: boolean;
}

type Shape = "circle" | "spiral" | "triangle" | "shard";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  angle: number; spin: number;
  size: number;
  life: number; maxLife: number;
  rgb: [number, number, number];
  alpha: number; // [0, 255]
  shape: Shape;
  agitation: number;
  phase: number; // pour la spirale
  glyph?: string; // particule-caractère (♪, ~, #…)
}

/** Caractères émis par régime, en plus des formes. */
const GLYPHS: Record<Shape, { share: number; chars: string[] }> = {
  circle: { share: 0.2, chars: ["~", "·", "○"] },
  spiral: { share: 0.3, chars: ["♪", "♫", "✦", "↑"] },
  triangle: { share: 0.12, chars: ["/", "\\", "△"] },
  shard: { share: 0.25, chars: ["#", "%", "!", "*", "×"] },
};

const MAX_PARTICLES = 900;
const MAX_CATCH_UP_DAYS = 30; // au-delà, un saut est peint sans particules
const MARGIN_X = 0.04; // marge horizontale (fraction de la largeur)
const MARGIN_Y = 0.12;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function asShape(shape: string): Shape {
  return (["circle", "spiral", "triangle", "shard"] as const).includes(shape as Shape) ? (shape as Shape) : "circle";
}

export function createSketch({ container, getFrame, reducedMotion }: SketchOptions) {
  const motion = reducedMotion ? 0.25 : 1; // vitesse globale réduite si l'utilisateur le demande

  return (p: p5) => {
    let trace: p5.Graphics; // calque persistant : la « peinture » de la période
    let particles: Particle[] = [];
    let lastIndex = -1;
    let lastDays: SymphonyDay[] | undefined;
    let lastRegime: string | undefined;
    let mosh = 0; // images de datamosh restantes
    let moshStrength = 1;
    const fx = newFxState();

    const xOf = (i: number, n: number) => p.width * (MARGIN_X + (1 - 2 * MARGIN_X) * (n > 1 ? i / (n - 1) : 0.5));
    const yOf = (y: number) => p.height * (0.5 - y * (0.5 - MARGIN_Y));

    // NB : pas de trace.remove() — p5 1.11 lève une TypeError sur Graphics.remove() en mode
    // instance. On libère l'ancien calque à la main (voir releaseGraphics).
    const makeTrace = () => {
      trace = p.createGraphics(p.width, p.height);
      trace.pixelDensity(p.pixelDensity());
      trace.clear();
    };

    const releaseGraphics = (g: p5.Graphics) => {
      const canvas = (g as unknown as { elt?: HTMLCanvasElement }).elt;
      if (canvas) {
        canvas.width = canvas.height = 0; // libère la mémoire du canevas
        canvas.remove();
      }
    };

    const reset = () => {
      particles = [];
      lastRegime = undefined;
      mosh = 0;
      trace.clear();
    };

    /** Émet les particules d'une séance. */
    const emit = (day: SymphonyDay, i: number, n: number) => {
      const { visual } = day;
      if (lastRegime !== undefined && day.regime !== lastRegime && !reducedMotion) {
        mosh = 16;
        moshStrength = day.regime === "panic" ? 2 : 1;
      }
      lastRegime = day.regime;
      const shape = asShape(visual.shape);
      const rgb = hexToRgb(visual.color);
      const count = Math.round(2 + visual.agitation * 10);
      const x0 = xOf(i, n);
      const y0 = yOf(visual.y);
      for (let k = 0; k < count; k++) {
        const g = GLYPHS[shape];
        const glyph = Math.random() < g.share ? g.chars[Math.floor(Math.random() * g.chars.length)] : undefined;
        const speed = (0.3 + visual.agitation * 2.5) * motion;
        let vx = p.random(-0.4, 0.4) * speed;
        let vy = p.random(-0.4, 0.4) * speed;
        if (shape === "spiral") vy = -p.random(0.4, 1.2) * speed; // monte
        if (shape === "shard") {
          const a = p.random(p.TWO_PI);
          const burst = p.random(1.5, 4) * speed;
          vx = Math.cos(a) * burst;
          vy = Math.sin(a) * burst;
        }
        particles.push({
          x: x0 + p.random(-3, 3), y: y0 + p.random(-3, 3), vx, vy,
          angle: p.random(p.TWO_PI),
          spin: (shape === "triangle" || shape === "shard" ? p.random(-0.15, 0.15) : 0.01) * motion,
          size: visual.size * p.random(0.35, 0.9),
          life: 0,
          maxLife: Math.round((shape === "circle" ? 200 : 90 + (1 - visual.agitation) * 110) / Math.max(motion, 0.5)),
          // fond clair : opacité plancher pour que les régimes calmes restent lisibles
          rgb, alpha: 120 + visual.opacity * 0.5, shape, agitation: visual.agitation,
          phase: p.random(p.TWO_PI),
          glyph,
        });
      }
      if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    };

    /** Mouvement propre à chaque régime. */
    const step = (q: Particle) => {
      q.life++;
      switch (q.shape) {
        case "circle": // flotte : bruit de Perlin doux
          q.vx += (p.noise(q.x * 0.004, q.y * 0.004, p.frameCount * 0.003) - 0.5) * 0.06 * motion;
          q.vy += (p.noise(q.y * 0.004, q.x * 0.004, p.frameCount * 0.003) - 0.5) * 0.06 * motion;
          q.vx *= 0.98; q.vy *= 0.98;
          break;
        case "spiral": // monte en tournant
          q.phase += 0.12 * motion;
          q.x += Math.cos(q.phase) * 0.9 * motion;
          q.vy *= 0.995;
          break;
        case "triangle": // changements de direction brusques
          if (p.random() < 0.08 * motion) {
            const a = p.random(p.TWO_PI);
            const s = (0.5 + q.agitation * 2) * motion;
            q.vx = Math.cos(a) * s; q.vy = Math.sin(a) * s;
          }
          break;
        case "shard": // éclats freinés puis attirés vers le bas
          q.vx *= 0.96; q.vy = q.vy * 0.96 + 0.05 * motion;
          break;
      }
      q.x += q.vx; q.y += q.vy;
      q.angle += q.spin;
    };

    const drawShape = (g: p5 | p5.Graphics, q: Particle, alpha: number, scale = 1) => {
      const s = q.size * scale;
      g.push();
      g.translate(q.x, q.y);
      g.rotate(q.angle);
      g.noStroke();
      g.fill(q.rgb[0], q.rgb[1], q.rgb[2], alpha);
      if (q.glyph) {
        g.rotate(-q.angle); // les caractères restent droits
        g.textSize(Math.max(10, s * 0.9));
        g.textAlign(g.CENTER, g.CENTER);
        g.text(q.glyph, 0, 0);
        g.pop();
        return;
      }
      switch (q.shape) {
        case "circle": // bulle : disque translucide cerclé, comme une onde sur l'eau
          g.fill(q.rgb[0], q.rgb[1], q.rgb[2], alpha * 0.45);
          g.circle(0, 0, s);
          g.noFill();
          g.stroke(q.rgb[0], q.rgb[1], q.rgb[2], alpha);
          g.strokeWeight(1.2);
          g.circle(0, 0, s);
          break;
        case "spiral": // étincelle : cœur doré et halo vert
          g.fill(q.rgb[0], q.rgb[1], q.rgb[2], alpha * 0.5);
          g.circle(0, 0, s * 0.7);
          g.fill(245, 184, 11, alpha); // or
          g.circle(0, 0, s * 0.32);
          break;
        case "triangle":
          g.triangle(0, -s * 0.6, s * 0.52, s * 0.3, -s * 0.52, s * 0.3);
          break;
        case "shard":
          g.quad(0, -s * 0.8, s * 0.12, 0, 0, s * 0.5, -s * 0.12, 0);
          break;
      }
      g.pop();
    };

    p.setup = () => {
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.createCanvas(container.clientWidth || 600, container.clientHeight || 320);
      p.frameRate(TARGET_FPS);
      p.textFont("JetBrains Mono");
      makeTrace();
    };

    // Appelé par le composant (ResizeObserver) quand le conteneur change de taille
    p.windowResized = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h || (w === p.width && h === p.height)) return;
      const sx = w / p.width, sy = h / p.height;
      p.resizeCanvas(w, h);
      // Conserve la peinture : l'ancien calque est recopié à la nouvelle échelle
      const old = trace;
      makeTrace();
      trace.image(old, 0, 0, w, h);
      releaseGraphics(old);
      for (const q of particles) { q.x *= sx; q.y *= sy; }
    };

    /** Peint instantanément les jours from…to inclus (après un saut ou un redimensionnement). */
    const paintRange = (days: SymphonyDay[], from: number, to: number) => {
      const n = days.length;
      trace.noStroke();
      for (let i = Math.max(from, 0); i <= Math.min(to, n - 1); i++) {
        const { visual } = days[i];
        const [r, g, b] = hexToRgb(visual.color);
        trace.fill(r, g, b, 30 + visual.opacity * 0.1);
        trace.circle(xOf(i, n), yOf(visual.y), visual.size * 0.5);
      }
    };

    p.draw = () => {
      const { days, index, started } = getFrame();

      // Nouvelle période ou retour en arrière : on repart d'une toile vierge
      if (days !== lastDays || index < lastIndex) {
        reset();
        if (days && index > 0) paintRange(days, 0, index - 1);
        lastDays = days;
        lastIndex = index - 1;
      }
      if (days && index > lastIndex) {
        // Grand saut (curseur, clic sur la courbe) : on peint d'un coup les jours sautés.
        // Petit saut (lecture rapide plus rapide que l'affichage) : chaque jour émet normalement.
        if (index - lastIndex > MAX_CATCH_UP_DAYS) {
          paintRange(days, lastIndex + 1, index - 1);
          lastIndex = index - 1;
        }
        for (let i = lastIndex + 1; i <= index; i++) emit(days[i], i, days.length);
        lastIndex = index;
      }

      p.clear();
      p.image(trace, 0, 0);

      // Atmosphère du régime autour de la tête de lecture
      if (started && days?.length) {
        const day = days[Math.min(index, days.length - 1)];
        regimeFx(p.drawingContext as CanvasRenderingContext2D, day.regime, {
          x: xOf(index, days.length), y: yOf(day.visual.y), w: p.width, h: p.height,
          t: p.frameCount, agitation: day.visual.agitation, scale: Math.min(1.3, Math.max(0.7, p.height / 420)), motion,
        }, fx);
      }

      // Particules vivantes + dépôt d'une trace légère
      const alive: Particle[] = [];
      for (const q of particles) {
        step(q);
        const fade = 1 - q.life / q.maxLife;
        if (fade <= 0) continue;
        drawShape(p, q, q.alpha * fade);
        if (q.life % 3 === 0 && !q.glyph) drawShape(trace, q, 10 + q.alpha * 0.04, 0.6);
        alive.push(q);
      }
      particles = alive;

      // Tête de lecture : halo à la position du jour courant
      if (days?.length) {
        const day = days[Math.min(index, days.length - 1)];
        const [r, g, b] = hexToRgb(day.visual.color);
        const x = xOf(index, days.length), y = yOf(day.visual.y);
        const pulse = 1 + Math.sin(p.frameCount * (0.05 + day.visual.agitation * 0.25) * motion) * 0.15;
        p.noStroke();
        for (let k = 4; k >= 1; k--) {
          p.fill(r, g, b, 22 * (5 - k));
          p.circle(x, y, day.visual.size * k * 0.7 * pulse);
        }
        p.fill(33, 29, 26, 230); // encre
        p.circle(x, y, 5);
        // ligne de base (rendement nul), en pointillés
        p.stroke(33, 29, 26, 40);
        p.strokeWeight(1);
        for (let lx = xOf(0, days.length); lx < xOf(days.length - 1, days.length); lx += 8) p.line(lx, yOf(0), lx + 3, yOf(0));
        p.noStroke();
      }

      // Datamosh : glissements de bandes + étirement de colonnes de pixels
      if (mosh > 0) {
        const k = (mosh / 16) * moshStrength;
        for (let s = 0; s < 4 * moshStrength; s++) {
          const h = p.random(3, 36);
          const y = p.random(0, p.height - h);
          const dx = p.random(-1, 1) * 40 * k;
          p.copy(0, y, p.width, h, dx, y, p.width, h);
        }
        const x = p.random(p.width * 0.1, p.width * 0.9);
        const y = p.random(0, p.height * 0.7);
        p.copy(x, y, 2, p.height * 0.3, x, y, p.random(40, 160) * k, p.height * 0.3);
        mosh--;
      }
    };
  };
}
