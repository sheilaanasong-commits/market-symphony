/**
 * Ticket de la séance d'écoute : le résumé chiffré de la période, imprimé comme un ticket de caisse.
 * Les régimes « consommés » apparaissent comme des articles, avec leur part du temps en barres ASCII.
 */
import { useMemo, type CSSProperties } from "react";
import { formatDuration, totalDurationMs } from "../audio/timing";
import type { RegimeId } from "../config/constants";
import { formatDate } from "../lib/format";
import type { RegimeInfo, SymphonyResponse } from "../types/symphony";
import { asciiBar, Barcode, Receipt, Row, Sep } from "./ui/Receipt";

const PCT = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });
const short = (iso: string) => formatDate(iso).replace(/\s\d{4}$/, "");

export default function SessionReceipt({ data, title }: { data: SymphonyResponse; title: string }) {
  const stats = useMemo(() => {
    const { days } = data;
    let peak = days[0].close;
    let mdd = 0;
    let worst = days[0];
    let best = days[0];
    const counts: Partial<Record<RegimeId, number>> = {};
    for (const d of days) {
      peak = Math.max(peak, d.close);
      mdd = Math.min(mdd, d.close / peak - 1);
      if (d.features.log_return < worst.features.log_return) worst = d;
      if (d.features.log_return > best.features.log_return) best = d;
      counts[d.regime] = (counts[d.regime] ?? 0) + 1;
    }
    return {
      perf: days[days.length - 1].close / days[0].close - 1,
      mdd,
      worst,
      best,
      counts,
      duration: formatDuration(totalDurationMs(days, 1)),
      seed: Math.round(days[0].close * 100) % 9973,
    };
  }, [data]);

  const n = data.days.length;
  const panicShare = (stats.counts.panic ?? 0) / n;
  const byId = (id: string): RegimeInfo | undefined => data.regimes.find((r) => r.id === id);

  return (
    // La clé relance l'impression du ticket à chaque nouvelle période
    <Receipt key={`${data.ticker}${data.start}${data.end}`}>
      <div className="r-title r-line">TICKET DE SÉANCE</div>
      <div className="r-small r-line">{title.toUpperCase()}</div>
      <div className="r-small r-line">
        {data.ticker} · {data.start} → {data.end}
      </div>
      <Sep />
      {data.regimes.map((r, i) => {
        const share = (stats.counts[r.id] ?? 0) / n;
        return (
          <div key={r.id} className="r-line" style={{ "--i": i + 2 } as CSSProperties}>
            <Row label={r.label} value={`${Math.round(share * 100)} %`} />
            <div className="r-bar" style={{ "--regime": r.color } as CSSProperties}>
              {asciiBar(share, 22)}
            </div>
          </div>
        );
      })}
      <Sep />
      <Row i={7} label="Séances" value={n} />
      <Row i={8} label="Pire séance" value={`${PCT.format(Math.expm1(stats.worst.features.log_return))} · ${short(stats.worst.date)}`} />
      <Row i={9} label="Meilleure" value={`${PCT.format(Math.expm1(stats.best.features.log_return))} · ${short(stats.best.date)}`} />
      <Row i={10} label="Pire repli" value={PCT.format(stats.mdd)} />
      <Row i={11} label="Écoute (×1)" value={stats.duration} />
      <Sep double />
      <Row i={12} bold label="PERFORMANCE" value={PCT.format(stats.perf)} />
      <Sep />
      {panicShare >= 0.15 && <div className="r-stamp">KRACH</div>}
      {panicShare < 0.05 && (stats.counts.bull ?? 0) / n > 0.5 && (
        <div className="r-stamp" style={{ borderColor: byId("bull")?.color, color: byId("bull")?.color }}>
          SÉRÉNITÉ
        </div>
      )}
      <Barcode seed={stats.seed} />
      <div className="r-small">MODÈLE {data.model.toUpperCase()} · PAS DE CONSEIL FINANCIER</div>
    </Receipt>
  );
}
