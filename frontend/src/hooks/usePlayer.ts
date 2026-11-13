/**
 * Lecteur : avance jour par jour, déclenche le son et expose l'état pour l'interface.
 * Le son ne démarre JAMAIS seul : uniquement après un clic sur « Lecture » (§8).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { SymphonyEngine } from "../audio/engine";
import { dayDurationMs } from "../audio/timing";
import type { PlaybackSpeed } from "../config/constants";
import type { SymphonyDay } from "../types/symphony";

export interface Player {
  current: number; // index du jour affiché
  playing: boolean;
  speed: PlaybackSpeed;
  muted: boolean;
  volume: number; // [0, 1]
  audioError: string | null;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  seek: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export function usePlayer(days: SymphonyDay[] | undefined): Player {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [audioError, setAudioError] = useState<string | null>(null);

  const engine = useRef<SymphonyEngine | null>(null);
  const next = useRef(0); // prochain jour à jouer
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Nouvelle période : retour au début, silence
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    next.current = 0;
    engine.current?.silence();
  }, [days]);

  useEffect(() => engine.current?.setMuted(muted), [muted]);
  useEffect(() => engine.current?.setVolume(volume), [volume]);
  useEffect(() => () => {
    engine.current?.dispose();
    engine.current = null;
  }, []);

  // Boucle de lecture : une séance, puis attente de sa durée (qui dépend du tempo du jour)
  useEffect(() => {
    if (!playing || !days?.length) return;
    let timer: number | undefined;
    const tick = () => {
      const i = next.current;
      if (i >= days.length) {
        setPlaying(false);
        engine.current?.silence();
        return;
      }
      const ms = dayDurationMs(days[i].audio.tempo_bpm, speedRef.current);
      engine.current?.playDay(days[i], ms / 1000);
      setCurrent(i);
      next.current = i + 1;
      timer = window.setTimeout(tick, ms);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [playing, days]);

  const play = useCallback(async () => {
    if (!days?.length) return;
    try {
      if (!engine.current) {
        engine.current = await SymphonyEngine.create();
        engine.current.setMuted(muted);
        engine.current.setVolume(volume);
      }
      setAudioError(null);
    } catch (err) {
      setAudioError(`Audio indisponible : ${(err as Error).message}`);
      return;
    }
    if (next.current >= days.length) next.current = 0; // relecture depuis le début
    setPlaying(true);
  }, [days, muted, volume]);

  const pause = useCallback(() => {
    setPlaying(false);
    engine.current?.silence();
  }, []);

  const toggle = useCallback(() => (playing ? pause() : void play()), [playing, pause, play]);

  const seek = useCallback(
    (index: number) => {
      const i = Math.min(Math.max(Math.round(index), 0), Math.max((days?.length ?? 1) - 1, 0));
      next.current = i;
      setCurrent(i);
    },
    [days],
  );

  return { current, playing, speed, muted, volume, audioError, play, pause, toggle, seek, setSpeed, setMuted, setVolume };
}
