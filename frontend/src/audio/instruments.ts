/**
 * Instruments Tone.js, un par régime (§5). Le backend indique `audio.instrument` pour chaque jour.
 * Chaque voix reçoit la note du jour ET le contexte musical (accord courant, temps dans la mesure),
 * pour jouer « avec » la basse et la batterie plutôt qu'à côté.
 *
 *   soft_piano     (calme)    : piano doux, notes liées ; un écho de tierce en fin de mesure
 *   bright_synth   (haussier) : arpège ascendant brillant (note → notes de l'accord vers le haut)
 *   pluck          (nerveux)  : staccato sec, note répétée quand l'agitation monte
 *   low_percussion (panique)  : cluster dissonant (seconde mineure) + grondement grave
 */
import * as Tone from "tone";
import type { SymphonyDay } from "../types/symphony";
import { nearestChordTone, type Chord } from "./harmony";

export interface MusicalContext {
  chord: Chord;
  beat: number; // temps dans la mesure (0 = temps fort)
}

export interface Voice {
  /** Joue une séance à l'instant `time` (horloge audio), `step` = durée du jour (s). */
  play(day: SymphonyDay, step: number, time: number, ctx: MusicalContext): void;
  release(): void;
  dispose(): void;
}

export const freq = (midi: number): number => Tone.Frequency(midi, "midi").toFrequency();

/**
 * Vélocité perçue, dans une plage étroite : assez haute pour que les séances calmes s'entendent,
 * jamais au maximum, pour qu'une séance à fort volume ne fasse pas sursauter.
 */
export const loud = (velocity: number, floor = 0.5, ceil = 0.82) => floor + (ceil - floor) * Math.min(Math.max(velocity, 0), 1);

/** Sur les temps forts, la note se cale sur l'accord ; sinon elle garde la gamme du régime. */
const melodyNote = (d: SymphonyDay, ctx: MusicalContext) => (ctx.beat % 2 === 0 ? nearestChordTone(d.audio.midi, ctx.chord) : d.audio.midi);

function softPiano(out: Tone.InputNode): Voice {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fattriangle", count: 2, spread: 12 },
    envelope: { attack: 0.012, decay: 0.6, sustain: 0.3, release: 1.6 },
    volume: -6,
  }).connect(out);
  synth.maxPolyphony = 32;
  return {
    play: (d, step, t, ctx) => {
      const note = melodyNote(d, ctx);
      const v = loud(d.audio.velocity);
      synth.triggerAttackRelease(freq(note), step * 2, t, v);
      // fin de phrase : une tierce douce répond à la mélodie
      if (ctx.beat === 3 && step >= 0.2) synth.triggerAttackRelease(freq(nearestChordTone(note - 4, ctx.chord)), step * 1.5, t + step * 0.5, v * 0.6);
    },
    release: () => synth.releaseAll(),
    dispose: () => synth.dispose(),
  };
}

function brightSynth(out: Tone.InputNode): Voice {
  const lead = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3,
    modulationIndex: 6,
    oscillator: { type: "sine" },
    modulation: { type: "triangle" },
    envelope: { attack: 0.004, decay: 0.25, sustain: 0.35, release: 0.5 },
    modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 },
    volume: -5,
  }).connect(out);
  lead.maxPolyphony = 32;
  const sparkle = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fattriangle", count: 3, spread: 14 }, // scintillant sans l'âpreté d'une dent de scie
    envelope: { attack: 0.004, decay: 0.14, sustain: 0.1, release: 0.25 },
    volume: -12,
  });
  const bright = new Tone.Filter(3800, "lowpass").connect(out);
  sparkle.connect(bright);
  sparkle.maxPolyphony = 32;
  return {
    play: (d, step, t, ctx) => {
      const note = melodyNote(d, ctx);
      const v = loud(d.audio.velocity, 0.55);
      lead.triggerAttackRelease(freq(note), step * 0.6, t, v);
      // arpège ascendant sur les notes de l'accord : l'élan haussier s'entend
      const above = ctx.chord.tones.map((x) => x + 60).filter((m) => m > note).slice(0, 3);
      // Arpège complet quand le temps est long ; une seule note brillante quand ça va vite
      const arp = (above.length ? above : [note + 12]).slice(0, step >= 0.25 ? 3 : step >= 0.15 ? 1 : 0);
      arp.forEach((m, i) => sparkle.triggerAttackRelease(freq(m), step * 0.22, t + ((i + 1) * step) / (arp.length + 1), v * 0.75));
    },
    release: () => {
      lead.releaseAll();
      sparkle.releaseAll();
    },
    dispose: () => [lead, sparkle, bright].forEach((n) => n.dispose()),
  };
}

function pluck(out: Tone.InputNode): Voice {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" }, // pincé boisé : nerveux sans être criard
    envelope: { attack: 0.002, decay: 0.16, sustain: 0, release: 0.1 },
    volume: -7,
  });
  const tone = new Tone.Filter(2200, "lowpass").connect(out);
  synth.connect(tone);
  synth.maxPolyphony = 32;
  return {
    play: (d, step, t, ctx) => {
      const note = melodyNote(d, ctx);
      const v = loud(d.audio.velocity);
      synth.triggerAttackRelease(freq(note), step * 0.25, t, v);
      // Agitation forte : la note est répétée, comme une hésitation
      if (d.visual.agitation > 0.35 && step >= 0.18) synth.triggerAttackRelease(freq(note), step * 0.15, t + step / 2, v * 0.75);
    },
    release: () => synth.releaseAll(),
    dispose: () => [synth, tone].forEach((n) => n.dispose()),
  };
}

function lowPercussion(out: Tone.InputNode): Voice {
  const cluster = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.35, sustain: 0.12, release: 0.5 },
    volume: -11,
  });
  const dark = new Tone.Filter(1200, "lowpass").connect(out);
  cluster.connect(dark);
  cluster.maxPolyphony = 32;
  const rumble = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.01, decay: 0.25, sustain: 0 },
    volume: -22,
  });
  const rumbleFilter = new Tone.Filter(300, "lowpass").connect(out); // grondement sourd, pas de souffle
  rumble.connect(rumbleFilter);
  return {
    play: (d, step, t) => {
      const { midi, velocity } = d.audio;
      const v = loud(velocity, 0.5, 0.75);
      // Triton (6 demi-tons) : la tension reste, sans le frottement strident de la seconde mineure ;
      // la seconde mineure n'apparaît, discrète, qu'au plus fort de la crise
      const notes = d.visual.agitation > 0.85 ? [freq(midi), freq(midi + 6), freq(midi + 13)] : [freq(midi), freq(midi + 6)];
      cluster.triggerAttackRelease(notes, step * 0.5, t, v * 0.8);
      if (d.visual.agitation > 0.8) {
        try {
          rumble.triggerAttackRelease(0.2, t, v * 0.6);
        } catch {
          /* synthé de bruit monophonique : coup ignoré s'il chevauche le précédent */
        }
      }
    },
    release: () => cluster.releaseAll(),
    dispose: () => [cluster, dark, rumble, rumbleFilter].forEach((n) => n.dispose()),
  };
}

export const INSTRUMENTS: Record<string, (out: Tone.InputNode) => Voice> = {
  soft_piano: softPiano,
  bright_synth: brightSynth,
  pluck,
  low_percussion: lowPercussion,
};
