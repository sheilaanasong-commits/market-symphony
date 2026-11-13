import { API_URL } from "../config/constants";
import type { Asset, Preset, SymphonyResponse } from "../types/symphony";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const fetchAssets = () => get<Asset[]>("/assets");
export const fetchPresets = () => get<Preset[]>("/presets");

export const fetchSymphony = (ticker: string, start: string, end: string) =>
  get<SymphonyResponse>(`/symphony?${new URLSearchParams({ ticker, start, end })}`);

/** Repli si le backend gratuit est en veille (§11) : JSON pré-calculé dans /public/presets. */
export async function fetchPresetSymphony(preset: Preset): Promise<SymphonyResponse> {
  try {
    return await fetchSymphony(preset.ticker, preset.start, preset.end);
  } catch {
    const res = await fetch(`/presets/${preset.id}.json`);
    return res.json() as Promise<SymphonyResponse>;
  }
}
