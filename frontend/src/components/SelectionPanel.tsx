/** Panneau de sélection (F1 actif, F2 période + préréglages). */
import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n";
import type { Asset, Preset } from "../types/symphony";

const TICKER_PATTERN = /^[\^A-Za-z0-9.\-=]{1,20}$/; // identique au backend (config.py)
const OTHER = "__other__";

interface Props {
  assets: Asset[];
  presets: Preset[];
  activePresetId: string | null;
  onPreset: (id: string) => void;
  onCustom: (ticker: string, start: string, end: string) => void;
  disabled?: boolean;
}

export default function SelectionPanel({ assets, presets, activePresetId, onPreset, onCustom, disabled }: Props) {
  const [choice, setChoice] = useState(assets[0]?.ticker ?? OTHER);
  const { t } = useI18n();
  const tx = t.selection;
  const [customTicker, setCustomTicker] = useState("");
  const [start, setStart] = useState("2019-11-01");
  const [end, setEnd] = useState("2020-09-30");
  const [formError, setFormError] = useState<string | null>(null);

  const ticker = choice === OTHER || !assets.length ? customTicker.trim().toUpperCase() : choice;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!TICKER_PATTERN.test(ticker)) return setFormError(tx.badTicker);
    if (!start || !end || start >= end) return setFormError(tx.badDates);
    setFormError(null);
    onCustom(ticker, start, end);
  };

  return (
    <aside className="panel">
      <section>
        <h3>{tx.presets}</h3>
        <div className="preset-list">
          {presets.map((p) => (
            <button
              key={p.id}
              className={`preset ${p.id === activePresetId ? "active" : ""}`}
              onClick={() => onPreset(p.id)}
              disabled={disabled}
              aria-pressed={p.id === activePresetId}
            >
              <span>{t.presets[p.id] ?? p.name}</span>
              <small>
                {p.start.slice(0, 4)}–{p.end.slice(0, 4)} · {p.ticker}
              </small>
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={submit}>
        <h3>{tx.free}</h3>
        {assets.length > 0 && (
          <label>
            {tx.asset}
            <select value={choice} onChange={(e) => setChoice(e.target.value)}>
              {assets.map((a) => (
                <option key={a.ticker} value={a.ticker}>
                  {a.name} ({a.ticker})
                </option>
              ))}
              <option value={OTHER}>{tx.other}</option>
            </select>
          </label>
        )}
        {(choice === OTHER || !assets.length) && (
          <label>
            {tx.ticker}
            <input value={customTicker} onChange={(e) => setCustomTicker(e.target.value)} placeholder={tx.tickerPlaceholder} />
          </label>
        )}
        <div className="dates">
          <label>
            {tx.start}
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            {tx.end}
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        {formError && <p className="error">{formError}</p>}
        <button type="submit" className="primary" disabled={disabled}>
          {tx.compose}
        </button>
        {!assets.length && <p className="hint">{tx.offlineHint}</p>}
      </form>
    </aside>
  );
}
