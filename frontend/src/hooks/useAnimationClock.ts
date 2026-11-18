/**
 * Horloge d'animation partagée par les dessins ASCII : appelle `onTick(t)` à `fps` images/s
 * tant que l'élément est visible à l'écran. Respecte `prefers-reduced-motion` (une seule image).
 */
import { useEffect, useRef, type RefObject } from "react";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
}

export function useAnimationClock(ref: RefObject<HTMLElement>, onTick: (t: number) => void, fps = 12) {
  const tick = useRef(onTick);
  tick.current = onTick;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = 0;
    let visible = true;
    let t = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < 1000 / fps) return;
      last = now;
      tick.current(t++);
    };
    tick.current(t++);
    if (prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [ref, fps]);
}

/** Nombre de colonnes de texte monospace qui tiennent dans l'élément. */
export function measureColumns(el: HTMLElement): number {
  const probe = document.createElement("span");
  probe.textContent = "M".repeat(20);
  probe.style.visibility = "hidden";
  probe.style.position = "absolute";
  el.appendChild(probe);
  const charWidth = probe.getBoundingClientRect().width / 20 || 8;
  probe.remove();
  return Math.max(10, Math.floor(el.clientWidth / charWidth));
}
