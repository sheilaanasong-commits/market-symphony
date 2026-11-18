/** Tableau génératif animé d'une humeur de marché (voir visual/moodArt.ts). */
import { useEffect, useRef } from "react";
import type { RegimeId } from "../../config/constants";
import { useAnimationClock } from "../../hooks/useAnimationClock";
import { MOOD_ART, newMoodState } from "../../visual/moodArt";

export default function MoodArt({ regime, height = 150 }: { regime: RegimeId; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef(newMoodState());
  const size = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth, h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      size.current = { w, h };
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useAnimationClock(ref as React.RefObject<HTMLElement>, (t) => {
    const g = ref.current?.getContext("2d");
    const { w, h } = size.current;
    if (g && w) MOOD_ART[regime](g, w, h, t * 2, state.current);
  }, 30);

  return <canvas ref={ref} className="mood-art" style={{ height }} aria-hidden="true" />;
}
