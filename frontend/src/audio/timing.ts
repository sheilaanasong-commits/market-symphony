import { MS_PER_DAY_AT_X1, REFERENCE_BPM } from "../config/constants";
import type { SymphonyDay } from "../types/symphony";

/**
 * Durée d'une séance à l'écoute (ms).
 * Le tempo vient de la volatilité (§5) : un marché agité « accélère »,
 * un marché calme s'étire. À REFERENCE_BPM et vitesse ×1 : MS_PER_DAY_AT_X1.
 */
export function dayDurationMs(tempoBpm: number, speed: number): number {
  return (MS_PER_DAY_AT_X1 * REFERENCE_BPM) / Math.max(tempoBpm, 1) / Math.max(speed, 0.1);
}

/** Durée totale d'écoute d'une période (ms). */
export function totalDurationMs(days: SymphonyDay[], speed: number): number {
  return days.reduce((sum, d) => sum + dayDurationMs(d.audio.tempo_bpm, speed), 0);
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
