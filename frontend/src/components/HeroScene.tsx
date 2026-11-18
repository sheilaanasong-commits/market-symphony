/**
 * Bandeau d'accueil : la scène « crépuscule sur les marchés » (visual/heroScene.ts) et ses
 * panneaux façon terminal — un tableau de cotations simulées et un panneau « écoute »
 * qui affiche le régime joué par la scène.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { REGIME_COLORS, type RegimeId } from "../config/constants";
import { prefersReducedMotion } from "../hooks/useAnimationClock";
import { useI18n } from "../i18n";
import { formatLocale } from "../lib/format";
import { startHeroScene } from "../visual/heroScene";

const QUOTES = [
  { sym: "^GSPC", price: 5870.2 },
  { sym: "AAPL", price: 224.17 },
  { sym: "MSFT", price: 418.32 },
  { sym: "NVDA", price: 147.63 },
  { sym: "AMZN", price: 201.24 },
  { sym: "BTC", price: 67567 },
];

const DRIFT: Record<RegimeId, number> = { calm: 0, bull: 0.004, nervous: -0.002, panic: -0.012 };

function Quotes({ regime }: { regime: RegimeId }) {
  const { t } = useI18n();
  const [rows, setRows] = useState(() => QUOTES.map((q) => ({ ...q, chg: 0, flash: 0 })));
  const regimeRef = useRef(regime);
  regimeRef.current = regime;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setRows((rs) =>
        rs.map((r) => {
          if (Math.random() < 0.4) return { ...r, flash: 0 };
          const vol = regimeRef.current === "panic" ? 0.012 : regimeRef.current === "nervous" ? 0.006 : 0.003;
          const d = DRIFT[regimeRef.current] / 4 + (Math.random() - 0.5) * 2 * vol;
          return { ...r, price: r.price * (1 + d), chg: Math.max(-25, Math.min(25, r.chg + d * 100)), flash: d >= 0 ? 1 : -1 };
        }),
      );
    }, 900);
    return () => window.clearInterval(id);
  }, []);
  const fmt = new Intl.NumberFormat(formatLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="hud hud-quotes">
      <div className="hud-title">
        {t.hud.markets} <span>{t.hud.simulation}</span>
      </div>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sym} className={r.flash > 0 ? "flash-up" : r.flash < 0 ? "flash-down" : ""}>
              <td>{r.sym}</td>
              <td>{fmt.format(r.price)}</td>
              <td className={r.chg >= 0 ? "up" : "down"}>
                {r.chg >= 0 ? "▲" : "▼"} {r.chg >= 0 ? "+" : ""}
                {fmt.format(r.chg)} %
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HeroScene({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [now, setNow] = useState<{ regime: RegimeId; tempo: number }>({ regime: "bull", tempo: 104 });

  useEffect(() => {
    if (!canvas.current) return;
    return startHeroScene(canvas.current, {
      reducedMotion: prefersReducedMotion(),
      onRegime: (regime, tempo) => setNow({ regime, tempo }),
    });
  }, []);

  const info = t.regimes[now.regime];
  return (
    <section className="hero-scene" style={{ "--regime": REGIME_COLORS[now.regime] } as CSSProperties}>
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content">{children}</div>
      <Quotes regime={now.regime} />
      <div className="hud hud-listen" aria-live="polite">
        <div className="hud-title">{t.hud.listen}</div>
        <div className="hud-regime">
          <span className="dot" /> {info.label.toUpperCase()}
        </div>
        <div className="eq" aria-hidden="true" style={{ "--speed": `${60 / now.tempo}s` } as CSSProperties}>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i * 0.07) % 0.5}s` }} />
          ))}
        </div>
        <div className="hud-meta">
          {now.tempo} BPM · {info.scale}
        </div>
        <div className="hud-meta">{t.hud.live}</div>
      </div>
    </section>
  );
}
