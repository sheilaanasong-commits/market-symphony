/**
 * Page Studio (§7) : sélection à gauche, canevas génératif au centre, légende en haut,
 * courbe de référence et barre de lecture en bas. L'état (préréglage ou période) vit dans l'URL :
 *   /studio?preset=subprime_2008   ou   /studio?ticker=AAPL&start=2020-01-01&end=2020-12-31
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PlaybackBar from "../components/PlaybackBar";
import PriceChart from "../components/PriceChart";
import RegimeLegend from "../components/RegimeLegend";
import SelectionPanel from "../components/SelectionPanel";
import SessionReceipt from "../components/SessionReceipt";
import Stage from "../components/Stage";
import { HERO_PRESET_ID } from "../config/constants";
import { usePlayer } from "../hooks/usePlayer";
import { useSymphony, type SymphonyRequest } from "../hooks/useSymphony";
import { fetchAssets, fetchPresets } from "../lib/api";
import { exportStageAsPng } from "../lib/exportCanvas";
import { Rich, useI18n } from "../i18n";
import type { Asset, Preset } from "../types/symphony";

export default function Studio() {
  const [params, setParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPresets(controller.signal)
      .then(({ data }) => setPresets(data))
      .catch((err: Error) => !controller.signal.aborted && setListError(err.message));
    fetchAssets(controller.signal)
      .then(setAssets)
      .catch(() => undefined); // hors ligne : préréglages seulement
    return () => controller.abort();
  }, []);

  // URL → demande de symphonie
  const presetId = params.get("preset") ?? (params.get("ticker") ? null : HERO_PRESET_ID);
  const request = useMemo<SymphonyRequest | null>(() => {
    if (presetId) {
      const preset = presets.find((p) => p.id === presetId);
      return preset ? { kind: "preset", preset } : null;
    }
    const [ticker, start, end] = ["ticker", "start", "end"].map((k) => params.get(k));
    return ticker && start && end ? { kind: "custom", ticker, start, end } : null;
  }, [presetId, presets, params]);

  const { t } = useI18n();
  const ts = t.studio;
  const { data, loading, error, offline } = useSymphony(request);
  const player = usePlayer(data?.days);
  const day = data?.days[player.current];
  const started = player.playing || player.current > 0;

  // Espace = lecture / pause (sauf pendant la saisie dans un champ)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.code !== "Space" || ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag) || !data) return;
      e.preventDefault();
      player.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, data]);

  const preset = presets.find((p) => p.id === presetId);
  const title = preset ? (t.presets[preset.id] ?? preset.name) : data ? `${data.ticker}` : "";

  return (
    <main className="studio">
      <SelectionPanel
        key={assets.length} // réinitialise le choix d'actif quand la liste arrive
        assets={assets}
        presets={presets}
        activePresetId={presetId}
        onPreset={(id) => setParams({ preset: id })}
        onCustom={(ticker, start, end) => setParams({ ticker, start, end })}
        disabled={loading}
      />

      <section className="main">
        <header className="studio-header">
          <div>
            <h2>{title}</h2>
            {data && (
              <small>
                {data.start} → {data.end} · {ts.model} {data.model.toUpperCase()}
                {offline && ` · ${ts.offline}`}
              </small>
            )}
          </div>
          {data && <RegimeLegend regimes={data.regimes} current={started ? day?.regime : undefined} />}
        </header>

        {loading && (
          <p className="status">
            {ts.loading}
            {request?.kind === "custom" && ts.coldStart}
          </p>
        )}
        {(error || listError) && <p className="status error">⚠ {error ?? listError}</p>}
        {player.audioError && <p className="status error">⚠ {ts.audioUnavailable} : {player.audioError}</p>}

        <Stage days={data?.days} index={player.current} ticker={data?.ticker} started={started} />
        {data && data.days.length > 0 && (
          <>
            <PriceChart days={data.days} index={player.current} onSeek={player.seek} started={started} />
            <PlaybackBar days={data.days} player={player} />
          </>
        )}
      </section>

      <aside className="side">
        {data && data.days.length > 0 && (
          <div className="card export-card">
            <span className="eyebrow">{ts.exportEyebrow}</span>
            <p>{ts.exportText}</p>
            <button
              className="btn small primary"
              disabled={!started}
              title={started ? ts.exportButton : ts.exportHint}
              onClick={() => {
                const canvas = document.querySelector<HTMLCanvasElement>(".canvas-host canvas");
                if (canvas) void exportStageAsPng(canvas, { title, ticker: data.ticker, start: data.start, end: data.end, credit: ts.exportCredit });
              }}
            >
              {ts.exportButton}
            </button>
          </div>
        )}
        {data && data.days.length > 0 && <SessionReceipt data={data} title={title} />}
        <div className="card">
          <span className="eyebrow">{ts.howEyebrow}</span>
          <p>
            <Rich text={ts.how1} />
          </p>
          <p>
            <Rich text={ts.how2} />
          </p>
        </div>
      </aside>
    </main>
  );
}
