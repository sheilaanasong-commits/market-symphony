/**
 * Constantes frontend — miroir de backend/app/core/constant.py et config.yaml.
 * Toute modification doit rester synchronisée avec le backend.
 */

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type RegimeId = "calm" | "bull" | "nervous" | "panic";

export const REGIME_COLORS: Record<RegimeId, string> = {
  calm: "#3B82F6",
  bull: "#22C55E",
  nervous: "#F97316",
  panic: "#EF4444",
};

export const PLAYBACK_SPEEDS = [1, 2, 4, 8] as const;
export const MS_PER_DAY_AT_X1 = 250;
export const TARGET_FPS = 60;

/** Préréglage mis en avant sur la page d'accueil (« Écouter le krach de 2008 »). */
export const HERO_PRESET_ID = "subprime_2008";
