/**
 * Constantes frontend — miroir de backend/app/core/constant.py et config.yaml.
 * Toute modification doit rester synchronisée avec le backend.
 */

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8010";

export type RegimeId = "calm" | "bull" | "nervous" | "panic";

export const REGIME_COLORS: Record<RegimeId, string> = {
  calm: "#3B82F6",
  bull: "#22C55E",
  nervous: "#F97316",
  panic: "#EF4444",
};

export const PLAYBACK_SPEEDS = [1, 2, 4, 8] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export const MS_PER_DAY_AT_X1 = 250;
export const TARGET_FPS = 60;

/** Tempo auquel une séance dure exactement MS_PER_DAY_AT_X1 (voir audio/timing.ts). */
export const REFERENCE_BPM = 100;

/** Nappe sonore tenue pendant chaque régime : intervalles (demi-tons) au-dessus de PAD_ROOT_MIDI. */
export const PAD_ROOT_MIDI = 48; // Do 3, une octave sous la mélodie
export const PAD_CHORDS: Record<RegimeId, number[]> = {
  calm: [0, 4, 7, 11], // majeur 7 : serein
  bull: [0, 4, 7, 9], // majeur 6 : lumineux
  nervous: [0, 3, 7, 10], // mineur 7 : inquiet
  panic: [0, 1, 6], // seconde mineure + triton : dissonant
};

/** Préréglage mis en avant sur la page d'accueil (« Écouter le krach de 2008 »). */
export const HERO_PRESET_ID = "subprime_2008";
