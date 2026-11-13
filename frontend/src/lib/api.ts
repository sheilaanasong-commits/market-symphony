import { API_URL } from "../config/constants";
import type { Asset, Preset, SymphonyResponse } from "../types/symphony";

/** Délai maximal d'une requête : un backend gratuit en veille peut ne jamais répondre à temps. */
const REQUEST_TIMEOUT_MS = 8_000;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) {
    // FastAPI renvoie { detail: "..." } en cas d'erreur
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.detail ?? res.statusText);
  }
  return (await res.json()) as T;
}

const api = <T>(path: string) => getJson<T>(`${API_URL}${path}`);

export const fetchAssets = () => api<Asset[]>("/assets");
export const fetchPresets = () => api<Preset[]>("/presets");

export const fetchSymphony = (ticker: string, start: string, end: string) =>
  api<SymphonyResponse>(`/symphony?${new URLSearchParams({ ticker, start, end })}`);

/**
 * Préréglage : API en priorité, sinon JSON pré-calculé dans /public/presets (§11).
 * Une erreur 4xx (requête invalide) n'est pas masquée par le repli.
 */
export async function fetchPresetSymphony(preset: Preset): Promise<SymphonyResponse> {
  try {
    return await fetchSymphony(preset.ticker, preset.start, preset.end);
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err;
    return getJson<SymphonyResponse>(`/presets/${preset.id}.json`);
  }
}
