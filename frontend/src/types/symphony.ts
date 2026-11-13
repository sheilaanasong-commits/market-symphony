/** Types des réponses de l'API — miroir de backend/app/api/schemas.py */
import type { RegimeId } from "../config/constants";

export interface Asset { ticker: string; name: string; type: string; source: string }
export interface Preset { id: string; name: string; ticker: string; start: string; end: string }

export interface RegimeInfo { id: RegimeId; label: string; color: string; scale: string; description: string }

export interface AudioParams {
  midi: number; velocity: number; tempo_bpm: number; reverb_wet: number;
  instrument: string; articulation: string;
}

export interface VisualParams {
  y: number; size: number; agitation: number; opacity: number; color: string; shape: string;
}

export interface SymphonyDay {
  date: string; close: number; features: Record<string, number>;
  regime: RegimeId; audio: AudioParams; visual: VisualParams;
}

export interface SymphonyResponse {
  ticker: string; start: string; end: string; model: string;
  regimes: RegimeInfo[]; days: SymphonyDay[];
}
