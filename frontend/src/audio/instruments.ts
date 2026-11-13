/**
 * Instruments Tone.js, un par régime (§5). Le backend indique `audio.instrument`
 * pour chaque jour ; ce module le traduit en son.
 *
 *   soft_piano     (calme)    : notes longues et liées, timbre doux
 *   bright_synth   (haussier) : note + écho à l'octave, rythme vif
 *   pluck          (nerveux)  : staccato sec, répétitions quand ça s'agite
 *   low_percussion (panique)  : grosse caisse grave, cluster dissonant, bruit
 */
import * as Tone from "tone";
import type { SymphonyDay } from "../types/symphony";

export interface Voice {
  /** Joue une séance à l'instant `time` (secondes, horloge audio), `step` = durée du jour (s). */
  play(day: SymphonyDay, step: number, time: number): void;
  /** Relâche toutes les notes tenues. */
  release(): void;
  dispose(): void;
}

export const freq = (midi: number): number => Tone.Frequency(midi, "midi").toFrequency();

function softPiano(out: Tone.InputNode): Voice {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.25, release: 1.5 },
    volume: -8,
  }).connect(out);
  synth.maxPolyphony = 32;
  return {
    play: (d, step, t) => synth.triggerAttackRelease(freq(d.audio.midi), step * 2, t, d.audio.velocity),
    release: () => synth.releaseAll(),
    dispose: () => synth.dispose(),
  };
}

function brightSynth(out: Tone.InputNode): Voice {
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 3,
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.4 },
    volume: -14,
  }).connect(out);
  synth.maxPolyphony = 32;
  return {
    play: (d, step, t) => {
      const { midi, velocity } = d.audio;
      synth.triggerAttackRelease(freq(midi), step * 0.45, t, velocity);
      synth.triggerAttackRelease(freq(midi + 12), step * 0.3, t + step / 2, velocity * 0.5);
    },
    release: () => synth.releaseAll(),
    dispose: () => synth.dispose(),
  };
}

function pluck(out: Tone.InputNode): Voice {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
    volume: -20,
  }).connect(out);
  synth.maxPolyphony = 32;
  return {
    play: (d, step, t) => {
      const { midi, velocity } = d.audio;
      synth.triggerAttackRelease(freq(midi), step * 0.25, t, velocity);
      // Agitation forte : la note est répétée, comme une hésitation
      if (d.visual.agitation > 0.4) synth.triggerAttackRelease(freq(midi), step * 0.15, t + step / 2, velocity * 0.7);
    },
    release: () => synth.releaseAll(),
    dispose: () => synth.dispose(),
  };
}

function lowPercussion(out: Tone.InputNode): Voice {
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, volume: -6 }).connect(out);
  const cluster = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.3 },
    volume: -24,
  }).connect(out);
  cluster.maxPolyphony = 32;
  const noise = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    volume: -16,
  }).connect(out);
  return {
    play: (d, step, t) => {
      const { midi, velocity } = d.audio;
      kick.triggerAttackRelease(freq(midi - 24), step * 0.5, t, velocity);
      // Seconde mineure : l'intervalle le plus dissonant
      cluster.triggerAttackRelease([freq(midi), freq(midi + 1)], step * 0.4, t, velocity * 0.8);
      if (d.visual.agitation > 0.6) noise.triggerAttackRelease(0.1, t, velocity * d.visual.agitation);
    },
    release: () => cluster.releaseAll(),
    dispose: () => [kick, cluster, noise].forEach((n) => n.dispose()),
  };
}

export const INSTRUMENTS: Record<string, (out: Tone.InputNode) => Voice> = {
  soft_piano: softPiano,
  bright_synth: brightSynth,
  pluck,
  low_percussion: lowPercussion,
};
