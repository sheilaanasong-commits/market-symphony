/**
 * Page Studio (§7) : sélection à gauche, scène au centre, légende en haut,
 * barre de lecture en bas. L'état (préréglage ou période) vit dans l'URL :
 *   /studio?preset=subprime_2008   ou   /studio?ticker=AAPL&start=2020-01-01&end=2020-12-31
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PlaybackBar from "../components/PlaybackBar";
import RegimeLegend from "../components/RegimeLegend";
import SelectionPanel from "../components/SelectionPanel";
import Stage from "../components/Stage";
import { HERO_PRESET_ID } from "../config/constants";
import { usePlayer } from "../hooks/usePlayer";
import { useSymphony, type SymphonyRequest } from "../hooks/useSymphony";
import { fetchAssets, fetchPresets } from "../lib/api";
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

  const { data, loading, error, offline } = useSymphony(request);
  const player = usePlayer(data?.days);
  const day = data?.days[player.current];

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

  const title = presets.find((p) => p.id === presetId)?.name ?? (data ? `${data.ticker}` : "");

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
                {data.start} → {data.end} · modèle {data.model.toUpperCase()}
                {offline && " · version pré-calculée (serveur injoignable)"}
              </small>
            )}
          </div>
          {data && <RegimeLegend regimes={data.regimes} current={player.playing || player.current > 0 ? day?.regime : undefined} />}
        </header>

        {loading && <p className="status">Composition en cours…</p>}
        {(error || listError) && <p className="status error">⚠ {error ?? listError}</p>}
        {player.audioError && <p className="status error">⚠ {player.audioError}</p>}

        <Stage day={day} ticker={data?.ticker} />
        {data && data.days.length > 0 && <PlaybackBar days={data.days} player={player} />}
      </section>
    </main>
  );
}
