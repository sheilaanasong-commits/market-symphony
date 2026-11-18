/**
 * Moteur audio : un petit ensemble qui joue la partition du marché, une séance = un temps.
 *
 *   mélodie  : instrument du régime, note du jour (calée sur l'accord aux temps forts)
 *   nappe    : accord tenu, change à chaque mesure (grille propre au régime, voir harmony.ts)
 *   basse    : fondamentale de l'accord au premier temps (et au troisième quand ça s'anime)
 *   batterie : motif propre au régime (aucun en calme, pulsation en haussier, contretemps en
 *              nerveux, grosse caisse à chaque temps en panique)
 *   transition : un souffle de bruit filtré marque chaque changement de régime
 *
 * Lecture rapide : la densité musicale ne suit PAS la vitesse. En ×8, une séance de crise dure
 * ~20 ms ; jouer chaque séance donnerait 50 notes/s, une bouillie. Les séances trop rapprochées
 * (< MIN_EVENT_GAP_S) sont regroupées : on joue la plus marquante du groupe (plus grand mouvement),
 * et chaque « temps » musical dure au moins MIN_EVENT_GAP_S. Un changement de régime est toujours joué.
 *
 * Confort d'écoute : la tension d'une crise s'entend dans le tempo, l'harmonie et la couleur,
 * PAS dans le volume ni dans la stridence.
 *   - l'intensité des notes est lissée d'un jour à l'autre et contenue dans une plage étroite ;
 *   - plus le marché est agité, plus le mix est légèrement ATTÉNUÉ (jusqu'à −5 dB) et ASSOMBRI
 *     (filtre passe-bas de 9 kHz à 4 kHz) : une panique gronde au lieu de crier ;
 *   - réverbération plafonnée, percussions et bruits discrets.
 *
 * Chaîne : voix ─► réverbération ─┐
 *          basse, batterie ───────┴─► compresseur ─► atténuation ─► filtre ─► volume ─► limiteur ─► sortie
 */
import * as Tone from "tone";
import type { RegimeId } from "../config/constants";
import type { SymphonyDay } from "../types/symphony";
import { BASS_ROOT_MIDI, BEATS_PER_BAR, chordAt, PAD_ROOT_MIDI, type Chord } from "./harmony";
import { INSTRUMENTS, freq, loud, type Voice } from "./instruments";

const SCHEDULE_AHEAD_S = 0.05; // petite avance : évite les craquements sur les notes immédiates
const MASTER_DB = 1; // calibré à la mesure : ≈ −21 dB RMS, crêtes ≈ −7 dBFS au volume par défaut
const VELOCITY_SMOOTHING = 0.35; // part du nouveau jour dans l'intensité lissée (0 = figée, 1 = brute)
const MAX_DUCK_DB = -5; // atténuation à agitation maximale
const BRIGHT_HZ = 9000; // filtre de sortie au calme…
const DARK_HZ = 4000; // …et en pleine panique
const MIN_EVENT_GAP_S = 0.12; // ≈ 8 notes/s au maximum : au-delà, l'oreille n'entend plus des notes
const MIN_SWELL_GAP_S = 1.5;

/**
 * Les synthés de bruit sont monophoniques : une note programmée avant la fin de la précédente
 * lève une erreur dans Tone.js. En lecture rapide, on préfère alors sauter ce coup de charleston.
 */
export function safely(trigger: () => void): void {
  try {
    trigger();
  } catch {
    /* coup ignoré : il chevaucherait le précédent */
  }
}

interface Drums {
  kick: Tone.PolySynth<Tone.MembraneSynth>;
  hat: Tone.NoiseSynth;
  swell: Tone.NoiseSynth;
  swellFilter: Tone.Filter;
}

export class SymphonyEngine {
  private regime: RegimeId | null = null;
  private beat = 0; // temps depuis le début de la section (le régime courant)
  private chord: Chord | null = null;
  private lastEvent = -Infinity; // instant (horloge audio) du dernier temps joué
  private lastSwell = -Infinity;
  private pending: SymphonyDay | null = null; // séance la plus marquante depuis le dernier temps joué
  private velocity: number | null = null; // intensité lissée

  private constructor(
    private readonly master: Tone.Volume,
    private readonly duck: Tone.Volume,
    private readonly tone: Tone.Filter,
    private readonly reverb: Tone.Reverb,
    private readonly pad: Tone.PolySynth,
    private readonly bass: Tone.PolySynth<Tone.MonoSynth>,
    private readonly drums: Drums,
    private readonly voices: Record<string, Voice>,
    private readonly nodes: Tone.ToneAudioNode[],
  ) {}

  /** Doit être appelé depuis un geste utilisateur (clic) : les navigateurs bloquent l'audio sinon. */
  static async create(): Promise<SymphonyEngine> {
    await Tone.start();
    const limiter = new Tone.Limiter(-3).toDestination();
    const master = new Tone.Volume(MASTER_DB).connect(limiter);
    const tone = new Tone.Filter({ frequency: BRIGHT_HZ, type: "lowpass", rolloff: -12 }).connect(master);
    const duck = new Tone.Volume(0).connect(tone);
    const comp = new Tone.Compressor({ threshold: -24, ratio: 2.5, attack: 0.02, release: 0.3 }).connect(duck);
    const reverb = new Tone.Reverb({ decay: 3.5, preDelay: 0.02, wet: 0.2 }).connect(comp);
    await reverb.ready;
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsine", count: 3, spread: 20 },
      envelope: { attack: 0.8, decay: 0.5, sustain: 0.8, release: 2 },
      volume: -17,
    }).connect(reverb);
    // Basse et grosse caisse polyphoniques : les notes peuvent se chevaucher (changement de régime, ×8)
    const bass = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: "triangle" },
      filter: { Q: 1, type: "lowpass" },
      filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.4, baseFrequency: 120, octaves: 2.5 },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.4 },
      volume: -11,
    }).connect(comp);
    bass.maxPolyphony = 4;
    const kick = new Tone.PolySynth(Tone.MembraneSynth, { pitchDecay: 0.04, octaves: 4, envelope: { attack: 0.002, decay: 0.25, sustain: 0 }, volume: -12 }).connect(comp);
    const hatFilter = new Tone.Filter(8000, "bandpass").connect(comp); // charleston feutré plutôt que sifflant
    const hat = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.002, decay: 0.03, sustain: 0 }, volume: -26 }).connect(hatFilter);
    const swellFilter = new Tone.Filter(400, "bandpass").connect(reverb);
    const swell = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.8, decay: 0.6, sustain: 0 }, volume: -26 }).connect(swellFilter);
    const voices = Object.fromEntries(Object.entries(INSTRUMENTS).map(([name, make]) => [name, make(reverb)]));
    return new SymphonyEngine(master, duck, tone, reverb, pad, bass, { kick, hat, swell, swellFilter }, voices, [
      limiter, master, tone, duck, comp, reverb, pad, bass, kick, hatFilter, hat, swellFilter, swell,
    ]);
  }

  /** Reçoit une séance ; `stepSeconds` = durée du jour à l'écoute. */
  playDay(incoming: SymphonyDay, stepSeconds: number): void {
    const time = Tone.now() + SCHEDULE_AHEAD_S;
    const regimeChange = incoming.regime !== this.regime;
    // Regroupement : on garde la séance au plus grand mouvement (un krach ne se perd pas)
    if (!this.pending || Math.abs(incoming.visual.y) >= Math.abs(this.pending.visual.y) || regimeChange) this.pending = incoming;
    if (!regimeChange && time - this.lastEvent < MIN_EVENT_GAP_S) return;
    // Intensité lissée : le volume échangé varie brutalement d'un jour à l'autre, pas la musique
    const raw = Math.max(this.pending.audio.velocity, incoming.audio.velocity);
    this.velocity = this.velocity === null ? raw : this.velocity + VELOCITY_SMOOTHING * (raw - this.velocity);
    const day = {
      ...this.pending,
      regime: incoming.regime,
      audio: { ...this.pending.audio, instrument: incoming.audio.instrument, velocity: this.velocity },
    };
    this.pending = null;
    this.lastEvent = time;
    // Durée musicale réelle d'un temps (jamais sous le seuil de lisibilité)
    stepSeconds = Math.max(stepSeconds, MIN_EVENT_GAP_S);
    const fast = stepSeconds < 0.2;

    if (regimeChange) this.enterRegime(day.regime, time);
    // Plus le marché est agité, plus le mix s'atténue et s'assombrit (pas de cris en pleine panique)
    const agitation = Math.min(Math.max(day.visual.agitation, 0), 1);
    this.duck.volume.rampTo(MAX_DUCK_DB * agitation, 0.6);
    this.tone.frequency.rampTo(BRIGHT_HZ - (BRIGHT_HZ - DARK_HZ) * agitation, 0.6);
    const beat = this.beat % BEATS_PER_BAR;
    const bar = Math.floor(this.beat / BEATS_PER_BAR);
    const regime = day.regime;

    // Nouvelle mesure : nouvel accord (nappe + basse)
    if (beat === 0 || !this.chord) {
      this.chord = chordAt(regime, bar);
      this.pad.releaseAll(time);
      // L'attaque de la nappe suit la durée d'une mesure : sinon, en lecture rapide, l'accord n'a jamais le temps de sonner
      this.pad.set({ envelope: { attack: Math.min(0.8, stepSeconds * BEATS_PER_BAR * 0.4) } });
      this.pad.triggerAttack(this.chord.tones.map((i) => freq(PAD_ROOT_MIDI + i)), time + 0.01, regime === "panic" ? 0.35 : 0.5);
    }
    const chord = this.chord;
    const v = loud(day.audio.velocity);
    const root = BASS_ROOT_MIDI + ((chord.root % 12) + 12) % 12;
    if (beat === 0) this.bass.triggerAttackRelease(freq(root), stepSeconds * (regime === "calm" ? 3.5 : 1.6), time, v);
    if (beat === 2 && regime !== "calm" && !fast) this.bass.triggerAttackRelease(freq(root + (regime === "bull" ? 12 : 7)), stepSeconds * 0.9, time, v * 0.85);

    this.playDrums(regime, beat, stepSeconds, time, v);
    // Moins de réverbération quand ça va vite : les traînées se superposeraient
    // Réverbération plafonnée (l'API envoie jusqu'à 0,7 : trop « cathédrale » en crise)
    const wet = 0.1 + 0.22 * Math.min(day.audio.reverb_wet / 0.7, 1);
    this.reverb.wet.rampTo(wet * (fast ? 0.6 : 1), 0.4);
    (this.voices[day.audio.instrument] ?? this.voices.soft_piano).play(day, stepSeconds, time, { chord, beat });
    this.beat++;
  }

  /** Coupe proprement tout ce qui sonne (pause, fin, changement de période). */
  silence(): void {
    this.pad.releaseAll();
    this.bass.releaseAll();
    Object.values(this.voices).forEach((v) => v.release());
    this.regime = null;
    this.chord = null;
    this.beat = 0;
    this.pending = null;
    this.lastEvent = -Infinity;
    this.velocity = null;
  }

  setMuted(muted: boolean): void {
    this.master.mute = muted;
  }

  /** Volume dans [0, 1]. */
  setVolume(volume: number): void {
    this.master.volume.rampTo(volume <= 0 ? -Infinity : Tone.gainToDb(volume) + MASTER_DB, 0.1);
  }

  dispose(): void {
    this.silence();
    Object.values(this.voices).forEach((v) => v.dispose());
    this.nodes.forEach((n) => n.dispose());
  }

  /** Changement de régime : nouvelle section, qui recommence au premier temps, annoncée par un souffle. */
  private enterRegime(regime: RegimeId, time: number): void {
    if (this.regime !== null && time - this.lastSwell >= MIN_SWELL_GAP_S) {
      this.lastSwell = time;
      this.drums.swellFilter.frequency.setValueAtTime(300, time);
      this.drums.swellFilter.frequency.exponentialRampToValueAtTime(regime === "panic" ? 3000 : 1500, time + 0.8);
      safely(() => this.drums.swell.triggerAttackRelease(0.9, time, 0.8));
    }
    this.regime = regime;
    this.beat = 0;
    this.chord = null;
  }

  private playDrums(regime: RegimeId, beat: number, step: number, t: number, v: number): void {
    const { kick, hat } = this.drums;
    const fast = step < 0.2; // pas de contretemps quand un temps est très court
    switch (regime) {
      case "calm": // presque rien : un souffle de charleston en début de mesure
        if (beat === 0) safely(() => hat.triggerAttackRelease(0.03, t, 0.25));
        break;
      case "bull": // pulsation dansante : grosse caisse 1 et 3, charleston à chaque temps et contretemps
        if (beat === 0 || beat === 2) kick.triggerAttackRelease("C1", step * 0.5, t, v);
        safely(() => hat.triggerAttackRelease(0.03, t, 0.45));
        if (!fast) safely(() => hat.triggerAttackRelease(0.03, t + step / 2, 0.6));
        break;
      case "nervous": // grosse caisse au 1, charleston décalé : la marche boite
        if (beat === 0) kick.triggerAttackRelease("C1", step * 0.4, t, v * 0.9);
        safely(() => hat.triggerAttackRelease(0.03, t + step * 0.5, 0.5));
        if (beat === 3 && !fast) safely(() => hat.triggerAttackRelease(0.03, t + step * 0.75, 0.4));
        break;
      case "panic": // battement de cœur grave (temps 1 et 3) : présent sans marteler
        if (beat === 0 || beat === 2) kick.triggerAttackRelease("A0", step * 0.4, t, v * 0.85);
        break;
    }
  }
}
