/** Légende des régimes (F5) : les 4 ambiances, le régime courant mis en avant. */
import type { CSSProperties } from "react";
import type { RegimeInfo } from "../types/symphony";

const SCALE_FR: Record<string, string> = {
  major: "gamme majeure",
  pentatonic: "gamme pentatonique",
  minor: "gamme mineure",
  dissonant: "dissonances",
};

export default function RegimeLegend({ regimes, current }: { regimes: RegimeInfo[]; current?: string }) {
  const active = regimes.find((r) => r.id === current);
  return (
    <div className="legend" aria-live="polite">
      <ul>
        {regimes.map((r) => (
          <li key={r.id} className={r.id === current ? "active" : ""} style={{ "--regime": r.color } as CSSProperties}>
            <span className="dot" />
            {r.label}
          </li>
        ))}
      </ul>
      <p>
        {active ? (
          <>
            <strong style={{ color: active.color }}>{active.label}</strong> · {SCALE_FR[active.scale] ?? active.scale} —{" "}
            {active.description}
          </>
        ) : (
          "Appuyez sur lecture pour écouter le marché."
        )}
      </p>
    </div>
  );
}
