/** Légende des régimes (F5) : les 4 ambiances, le régime courant mis en avant. */
import type { CSSProperties } from "react";
import { useI18n } from "../i18n";
import type { RegimeInfo } from "../types/symphony";

export default function RegimeLegend({ regimes, current }: { regimes: RegimeInfo[]; current?: string }) {
  const { t } = useI18n();
  // Libellés traduits côté interface (l'API les renvoie en français)
  const text = (r: RegimeInfo) => t.regimes[r.id] ?? { label: r.label, scale: r.scale, description: r.description };
  const active = regimes.find((r) => r.id === current);
  return (
    <div className="legend" aria-live="polite">
      <ul>
        {regimes.map((r) => (
          <li key={r.id} className={r.id === current ? "active" : ""} style={{ "--regime": r.color } as CSSProperties}>
            <span className="dot" />
            {text(r).label}
          </li>
        ))}
      </ul>
      <p>
        {active ? (
          <>
            <strong style={{ color: active.color }}>{text(active).label}</strong> · {text(active).scale} — {text(active).description}
          </>
        ) : (
          t.legend.idle
        )}
      </p>
    </div>
  );
}
