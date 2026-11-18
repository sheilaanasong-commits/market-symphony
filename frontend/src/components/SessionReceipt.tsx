/**
 * Ticket de la séance d'écoute : le résumé chiffré de la période, imprimé comme un ticket de caisse.
 * Les régimes « consommés » apparaissent comme des articles, avec leur part du temps en barres ASCII.
 */
import { useMemo, type CSSProperties } from "react";
import { formatDuration, totalDurationMs } from "../audio/timing";
import type { RegimeId } from "../config/constants";
import { useI18n } from "../i18n";
import { formatDayMonth, formatSignedPct } from "../lib/format";
import type { RegimeInfo, SymphonyResponse } from "../types/symphony";
import { asciiBar, Barcode, Receipt, Row, Sep } from "./ui/Receipt";

export default function SessionReceipt({ data, title }: { data: SymphonyResponse; title: string }) {
  const { t } = useI18n();
  const r = t.receipt;
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
      <div className="r-title r-line">{r.title}</div>
      <div className="r-small r-line">{title.toUpperCase()}</div>
      <div className="r-small r-line">
        {data.ticker} · {data.start} → {data.end}
      </div>
      <Sep />
      {data.regimes.map((reg, i) => {
        const share = (stats.counts[reg.id] ?? 0) / n;
        return (
          <div key={reg.id} className="r-line" style={{ "--i": i + 2 } as CSSProperties}>
            <Row label={t.regimes[reg.id]?.label ?? reg.label} value={`${Math.round(share * 100)} %`} />
            <div className="r-bar" style={{ "--regime": reg.color } as CSSProperties}>
              {asciiBar(share, 22)}
            </div>
          </div>
        );
      })}
      <Sep />
      <Row i={7} label={r.sessions} value={n} />
      <Row i={8} label={r.worst} value={`${formatSignedPct(Math.expm1(stats.worst.features.log_return))} · ${formatDayMonth(stats.worst.date)}`} />
      <Row i={9} label={r.best} value={`${formatSignedPct(Math.expm1(stats.best.features.log_return))} · ${formatDayMonth(stats.best.date)}`} />
      <Row i={10} label={r.drawdown} value={formatSignedPct(stats.mdd)} />
      <Row i={11} label={r.listen} value={stats.duration} />
      <Sep double />
      <Row i={12} bold label={r.performance} value={formatSignedPct(stats.perf)} />
      <Sep />
      {panicShare >= 0.15 && <div className="r-stamp">{r.crash}</div>}
      {panicShare < 0.05 && (stats.counts.bull ?? 0) / n > 0.5 && (
        <div className="r-stamp" style={{ borderColor: byId("bull")?.color, color: byId("bull")?.color }}>
          {r.serenity}
        </div>
      )}
      <Barcode seed={stats.seed} />
      <div className="r-small">{r.footer(data.model.toUpperCase())}</div>
    </Receipt>
  );
}
