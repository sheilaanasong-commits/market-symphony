/**
 * Outils ASCII partagés : pseudo-aléatoire déterministe et ordre des régimes.
 * (Les humeurs animées sont dessinées par visual/moodArt.ts et visual/regimeFx.ts.)
 */
import type { RegimeId } from "../config/constants";

/** Pseudo-aléatoire déterministe (même dessin à chaque rendu pour un même t). */
export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const REGIME_ORDER: RegimeId[] = ["calm", "bull", "nervous", "panic"];
