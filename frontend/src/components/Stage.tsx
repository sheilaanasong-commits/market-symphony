/**
 * Scène centrale (S5) : canevas génératif p5.js + lecture du jour en surimpression.
 * p5 est chargé à la demande (import dynamique) pour alléger le premier affichage.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import type p5 from "p5";
import { useI18n } from "../i18n";
import { formatDate, formatPct, formatPrice, formatReturn } from "../lib/format";
import type { SymphonyDay } from "../types/symphony";
import { createSketch, type SketchFrame } from "../visual/sketch";

interface Props {
  days?: SymphonyDay[];
  index: number;
  ticker?: string;
  /** Lecture commencée : tant que ce n'est pas le cas, la scène reste neutre (pas de teinte de régime). */
  started: boolean;
  /** Masquer date et prix (jeu « Devine le krach »). */
  hideReadout?: boolean;
  idleText?: string;
}

export default function Stage({ days, index, ticker, started, hideReadout = false, idleText }: Props) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<SketchFrame>({ days, index, started });
  frame.current = { days, index, started }; // lu par le sketch à chaque image, sans re-rendu React

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let instance: p5 | undefined;
    let cancelled = false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    import("p5").then(({ default: P5 }) => {
      if (cancelled) return;
      instance = new P5(createSketch({ container: el, getFrame: () => frame.current, reducedMotion }), el);
    });
    const observer = new ResizeObserver(() => instance?.windowResized?.());
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
      instance?.remove();
    };
  }, []);

  const day = days?.[index];
  return (
    <div className="stage" style={day && started ? ({ "--regime": day.visual.color } as CSSProperties) : undefined}>
      <div ref={host} className="canvas-host" aria-hidden="true" />
      {!started && <div className="stage-idle">{idleText ?? t.stage.idle}</div>}
      {day && !hideReadout && (
        <div className="readout">
          <span className="date">{formatDate(day.date)}</span>
          <span className="price">
            {ticker} {formatPrice(day.close)}
          </span>
          <span className={day.features.log_return >= 0 ? "up" : "down"}>{formatReturn(day.features.log_return)}</span>
          <span className="muted">
            {t.stage.volatility} {formatPct(day.features.volatility)}
          </span>
        </div>
      )}
    </div>
  );
}
