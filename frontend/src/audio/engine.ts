/**
 * Moteur audio : joue une séance à la fois et installe une nappe (accord tenu)
 * propre au régime courant, pour que l'ambiance change d'un coup avec le régime.
 *
 * Chaîne : instruments ─┐
 *                       ├─► réverbération ─► volume maître ─► limiteur ─► sortie
 *          nappe ───────┘
 */
import * as Tone from "tone";
import { PAD_CHORDS, PAD_ROOT_MIDI, type RegimeId } from "../config/constants";
import type { SymphonyDay } from "../types/symphony";
import { INSTRUMENTS, freq, type Voice } from "./instruments";

const SCHEDULE_AHEAD_S = 0.05; // petite avance : évite les craquements sur les notes immédiates

export class SymphonyEngine {
  private regime: RegimeId | null = null;

  private constructor(
    private readonly master: Tone.Volume,
    private readonly reverb: Tone.Reverb,
    private readonly pad: Tone.PolySynth,
    private readonly voices: Record<string, Voice>,
    private readonly nodes: Tone.ToneAudioNode[],
  ) {}

  /** Doit être appelé depuis un geste utilisateur (clic) : les navigateurs bloquent l'audio sinon. */
  static async create(): Promise<SymphonyEngine> {
    await Tone.start();
    const limiter = new Tone.Limiter(-3).toDestination();
    const master = new Tone.Volume(-6).connect(limiter);
    const reverb = new Tone.Reverb({ decay: 4, preDelay: 0.02, wet: 0.2 }).connect(master);
    await reverb.ready;
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 2.5 },
      volume: -22,
    }).connect(reverb);
    const voices = Object.fromEntries(Object.entries(INSTRUMENTS).map(([name, make]) => [name, make(reverb)]));
    return new SymphonyEngine(master, reverb, pad, voices, [limiter, master, reverb, pad]);
  }

  /** Joue une séance ; `stepSeconds` = durée du jour à l'écoute. */
  playDay(day: SymphonyDay, stepSeconds: number): void {
    const time = Tone.now() + SCHEDULE_AHEAD_S;
    this.setRegime(day.regime, time);
    this.reverb.wet.rampTo(day.audio.reverb_wet, 0.3);
    (this.voices[day.audio.instrument] ?? this.voices.soft_piano).play(day, stepSeconds, time);
  }

  /** Coupe proprement tout ce qui sonne (pause, fin, changement de période). */
  silence(): void {
    this.pad.releaseAll();
    Object.values(this.voices).forEach((v) => v.release());
    this.regime = null;
  }

  setMuted(muted: boolean): void {
    this.master.mute = muted;
  }

  /** Volume dans [0, 1]. */
  setVolume(volume: number): void {
    this.master.volume.rampTo(volume <= 0 ? -Infinity : Tone.gainToDb(volume) - 6, 0.1);
  }

  dispose(): void {
    this.silence();
    Object.values(this.voices).forEach((v) => v.dispose());
    this.nodes.forEach((n) => n.dispose());
  }

  private setRegime(regime: RegimeId, time: number): void {
    if (regime === this.regime) return;
    this.regime = regime;
    this.pad.releaseAll(time);
    this.pad.triggerAttack(PAD_CHORDS[regime].map((i) => freq(PAD_ROOT_MIDI + i)), time, 0.5);
  }
}
