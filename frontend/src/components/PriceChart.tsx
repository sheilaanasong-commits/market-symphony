/**
 * Courbe de référence (F6) — Lightweight Charts.
 *   - fond coloré par régime : bandes continues (dégradé CSS à arrêts nets) placées sous
 *     le graphique et recalées sur ses coordonnées — un histogramme laisserait des espaces ;
 *   - prix en gris pour toute la période, en blanc pour la partie déjà jouée ;
 *   - texture animée par régime dans les bandes + tête de lecture lumineuse (visual/bandTexture.ts) ;
 *   - un clic sur la courbe déplace la lecture à ce jour.
 */
import { useEffect, useMemo, useRef } from "react";
import { useAnimationClock } from "../hooks/useAnimationClock";
import { useI18n } from "../i18n";
import { drawBandTexture, regimeRuns } from "../visual/bandTexture";
import {
  createChart,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import type { SymphonyDay } from "../types/symphony";

interface Props {
  days: SymphonyDay[];
  index: number;
  onSeek: (index: number) => void;
  started?: boolean;
}

const REGIME_ALPHA = "2e"; // ≈ 18 % d'opacité (suffixe hexadécimal) : pastel sur fond clair

export default function PriceChart({ days, index, onSeek, started = true }: Props) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const bands = useRef<HTMLDivElement>(null);
  const texture = useRef<HTMLCanvasElement>(null);
  const runs = useMemo(() => regimeRuns(days.map((d) => d.regime)), [days]);
  const live = useRef({ index, started });
  live.current = { index, started };

  // Texture animée des bandes (12 images/s, suspendue hors écran)
  useAnimationClock(texture as React.RefObject<HTMLElement>, (t) => {
    const c = texture.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBandTexture(g, w, h, runs, days.length, live.current.index, t, live.current.started);
  }, 12);
  const chart = useRef<IChartApi | null>(null);
  const played = useRef<ISeriesApi<"Line"> | null>(null);
  const seekRef = useRef(onSeek);
  seekRef.current = onSeek;

  // Création du graphique et des séries à chaque nouvelle période
  useEffect(() => {
    const el = host.current;
    if (!el || !days.length) return;
    const css = getComputedStyle(document.documentElement);
    const muted = css.getPropertyValue("--ink-3").trim() || "#9a9188";
    const border = css.getPropertyValue("--line").trim() || "#e6ded0";
    const ink = css.getPropertyValue("--ink").trim() || "#211d1a";

    const c = createChart(el, {
      autoSize: true,
      layout: { background: { color: "transparent" }, textColor: muted, fontFamily: "JetBrains Mono, monospace", fontSize: 10 },
      grid: { vertLines: { visible: false }, horzLines: { color: border } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      crosshair: { mode: CrosshairMode.Magnet },
      handleScroll: false,
      handleScale: false,
    });

    const all = c.addLineSeries({ color: muted + "80", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    all.setData(days.map((d) => ({ time: d.date as Time, value: d.close })));

    played.current = c.addLineSeries({ color: ink, lineWidth: 2, priceLineVisible: false });
    c.timeScale().fitContent();

    // Bandes de régime : une couleur par suite de jours consécutifs du même régime.
    // Défilement et zoom désactivés + fitContent + bords fixés → les n barres occupent toute la
    // largeur de façon uniforme : la frontière avant le jour i est à i / n de la zone de tracé.
    const b = bands.current;
    if (b) {
      const pct = (i: number) => ((i / days.length) * 100).toFixed(3);
      const stops: string[] = [];
      let start = 0;
      for (let i = 1; i <= days.length; i++) {
        if (i < days.length && days[i].regime === days[start].regime) continue;
        const color = days[start].visual.color + REGIME_ALPHA;
        stops.push(`${color} ${pct(start)}%`, `${color} ${pct(i)}%`);
        start = i;
      }
      b.style.background = `linear-gradient(to right, ${stops.join(", ")})`;
    }
    // La zone de tracé exclut l'échelle de prix (à droite) et l'axe du temps (en bas)
    const fitBands = () => {
      const ts = c.timeScale();
      if (!b || !ts.width()) return;
      b.style.width = `${ts.width()}px`;
      b.style.bottom = `${ts.height()}px`;
    };
    c.timeScale().subscribeSizeChange(fitBands);
    const raf = requestAnimationFrame(fitBands);

    // L'index logique d'une barre correspond à l'index du jour (mêmes dates pour toutes les séries)
    c.subscribeClick((param) => {
      if (param.logical !== undefined) seekRef.current(Math.round(param.logical));
    });

    chart.current = c;
    return () => {
      cancelAnimationFrame(raf);
      c.remove();
      chart.current = null;
      played.current = null;
    };
  }, [days]);

  // Partie jouée + marqueur du jour courant
  useEffect(() => {
    const s = played.current;
    if (!s || !days.length) return;
    const i = Math.min(index, days.length - 1);
    s.setData(days.slice(0, i + 1).map((d) => ({ time: d.date as Time, value: d.close })));
    s.setMarkers([{ time: days[i].date as Time, position: "inBar", color: days[i].visual.color, shape: "circle", size: 1 }]);
  }, [days, index]);

  return (
    <div className="price-chart" title={t.chart.hint}>
      <div ref={bands} className="regime-bands" aria-hidden="true">
        <canvas ref={texture} className="band-texture" />
      </div>
      <div ref={host} className="chart-host" />
    </div>
  );
}
