/**
 * Harmonie : chaque régime a sa grille d'accords, jouée en mesures de BEATS_PER_BAR séances.
 * Tout est exprimé en demi-tons au-dessus de Do (les gammes du backend sont construites sur Do 4 = MIDI 60).
 *
 *   calme    : Cmaj7 – Am7 – Fmaj7 – G6        (I – vi – IV – V)    sereine, cyclique
 *   haussier : Cadd9 – G – Am7 – Fmaj7         (I – V – vi – IV)    la progression « optimiste » de la pop
 *   nerveux  : Cm7 – Abmaj7 – Fm7 – G7         (i – VI – iv – V7)   mineur, la dominante crée une tension irrésolue
 *   panique  : Cdim – C°7 – B°7 – Db°7         accords diminués qui glissent par demi-tons : aucun repos
 */
import type { RegimeId } from "../config/constants";

export const BEATS_PER_BAR = 4;
export const PAD_ROOT_MIDI = 48; // Do 3, une octave sous la mélodie
export const BASS_ROOT_MIDI = 36; // Do 2

export interface Chord {
  root: number; // demi-tons au-dessus de Do
  tones: number[]; // demi-tons au-dessus de Do (peuvent dépasser 12)
}

const ch = (root: number, ...intervals: number[]): Chord => ({ root, tones: intervals.map((i) => root + i) });

export const PROGRESSIONS: Record<RegimeId, Chord[]> = {
  calm: [ch(0, 0, 4, 7, 11), ch(9, 0, 3, 7, 10), ch(5, 0, 4, 7, 11), ch(7, 0, 4, 7, 9)],
  bull: [ch(0, 0, 4, 7, 14), ch(7, 0, 4, 7, 12), ch(9, 0, 3, 7, 10), ch(5, 0, 4, 7, 11)],
  nervous: [ch(0, 0, 3, 7, 10), ch(8, 0, 4, 7, 11), ch(5, 0, 3, 7, 10), ch(7, 0, 4, 7, 10)],
  panic: [ch(0, 0, 3, 6), ch(0, 0, 3, 6, 9), ch(-1, 0, 3, 6, 9), ch(1, 0, 3, 6, 9)],
};

export const chordAt = (regime: RegimeId, bar: number): Chord => {
  const prog = PROGRESSIONS[regime];
  return prog[((bar % prog.length) + prog.length) % prog.length];
};

/** Note de l'accord la plus proche de `midi` (la mélodie garde son sens : plus haut = hausse). */
export function nearestChordTone(midi: number, chord: Chord): number {
  const classes = new Set(chord.tones.map((t) => ((t % 12) + 12) % 12));
  for (let d = 0; d <= 6; d++) {
    for (const cand of [midi - d, midi + d]) if (classes.has(((cand % 12) + 12) % 12)) return cand;
  }
  return midi;
}
