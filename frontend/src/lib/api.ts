import { API_URL } from "../config/constants";
import type { Asset, Preset, SymphonyResponse } from "../types/symphony";

/** Délai maximal d'une requête : un backend gratuit en veille peut ne jamais répondre à temps. */
const REQUEST_TIMEOUT_MS = 8_000;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/** Résultat d'un chargement : `offline` si les données viennent des JSON pré-calculés. */
export interface Loaded<T> {
  data: T;
  offline: boolean;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!res.ok) {
    // FastAPI renvoie { detail: "..." } en cas d'erreur
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

const api = <T>(path: string, signal?: AbortSignal) => getJson<T>(`${API_URL}${path}`, signal);

/** Une erreur 4xx = requête invalide : le repli hors ligne ne doit pas la masquer. */
const isClientError = (err: unknown) => err instanceof ApiError && err.status >= 400 && err.status < 500;

/** Essaie l'API puis, si elle est injoignable, le fichier statique `fallbackUrl`. */
async function withFallback<T>(path: string, fallbackUrl: string, signal?: AbortSignal): Promise<Loaded<T>> {
  try {
    return { data: await api<T>(path, signal), offline: false };
  } catch (err) {
    if (isClientError(err) || signal?.aborted) throw err;
    return { data: await getJson<T>(fallbackUrl, signal), offline: true };
  }
}

export const fetchAssets = (signal?: AbortSignal) => api<Asset[]>("/assets", signal);

export const fetchPresets = (signal?: AbortSignal) =>
  withFallback<Preset[]>("/presets", "/presets/index.json", signal);

export const fetchSymphony = (ticker: string, start: string, end: string, signal?: AbortSignal) =>
  api<SymphonyResponse>(`/symphony?${new URLSearchParams({ ticker, start, end })}`, signal);

/** Préréglage : API en priorité, sinon JSON pré-calculé dans /public/presets (§11). */
export const fetchPresetSymphony = (preset: Preset, signal?: AbortSignal) =>
  withFallback<SymphonyResponse>(
    `/symphony?${new URLSearchParams({ ticker: preset.ticker, start: preset.start, end: preset.end })}`,
    `/presets/${preset.id}.json`,
    signal,
  );
