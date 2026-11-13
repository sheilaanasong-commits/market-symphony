/**
 * Scène centrale. Prototype S4 : un halo qui suit les paramètres visuels du jour
 * (couleur, taille, position, opacité). Remplacé par le canevas p5.js en S5.
 */
import type { CSSProperties } from "react";
import { formatDate, formatPct, formatPrice, formatReturn } from "../lib/format";
import type { SymphonyDay } from "../types/symphony";

export default function Stage({ day, ticker }: { day?: SymphonyDay; ticker?: string }) {
  if (!day) return <div className="stage empty" />;
  const { visual, features } = day;
  return (
    <div className="stage" style={{ "--regime": visual.color } as CSSProperties}>
      <div
        className="halo"
        style={{
          width: `${visual.size * 6}px`,
          height: `${visual.size * 6}px`,
          opacity: visual.opacity / 255,
          transform: `translate(-50%, calc(-50% + ${-visual.y * 25}%))`,
          animationDuration: `${1.6 - visual.agitation * 1.4}s`,
        }}
      />
      <div className="readout">
        <span className="date">{formatDate(day.date)}</span>
        <span className="price">
          {ticker} {formatPrice(day.close)}
        </span>
        <span className={features.log_return >= 0 ? "up" : "down"}>{formatReturn(features.log_return)}</span>
        <span className="muted">volatilité {formatPct(features.volatility)}</span>
      </div>
    </div>
  );
}
