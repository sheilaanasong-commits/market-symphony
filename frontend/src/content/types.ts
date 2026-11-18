/** Types du contenu éditorial (pages Contexte et Méthode), décliné par langue. */
import type { RegimeId } from "../config/constants";

export interface Actor { role: string; name: string; examples: string[]; text: string; metaphor: string }
export interface Fact { value: string; label: string }
export interface Episode {
  presetId: string;
  year: string;
  title: string;
  period: string;
  regime: RegimeId; // couleur dominante de l'épisode
  summary: string;
  causes: string[];
  actors: string[];
  facts: Fact[];
  listen: string;
}
export interface Movement { num: string; tempo: string; title: string; text: string; figure: string; tech: string }
export interface Feature { name: string; col: string; what: string; figure: string; role: string }
export interface Tool { name: string; layer: string; role: string; figure: string }
export interface Term { term: string; def: string }

export interface ContextPage {
  eyebrow: string;
  titleA: string; // *mot* = mis en valeur
  titleGlitch: string;
  titleEnd: string;
  lead: string;
  cards: { eyebrow: string; text: string }[]; // **gras**
  actorsEyebrow: string;
  actorsTitle: string;
  actorsLead: string;
  episodesEyebrow: string;
  episodesTitle: string;
  episodesLead: string;
  episodesAria: string;
  listenButton: string;
  causes: string;
  protagonists: string;
  listenLabel: string;
  quote: string;
  quoteAuthor: string;
}

export interface MethodPage {
  eyebrow: string;
  titleA: string;
  titleGlitch: string;
  titleEnd: string;
  lead: string;
  what: { eyebrow: string; text: string }[]; // quoi / comment / pourquoi
  sheet: { title: string; sub: string; rows: [string, string][]; predictions: string; motto: string; seed: string };
  pipelineEyebrow: string;
  pipelineTitle: string;
  pipelineLead: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresLead: string;
  featuresHead: [string, string, string, string];
  modelsEyebrow: string;
  modelsTitle: string;
  modelsLead: string;
  kmeans: { eyebrow: string; title: string; text: string; result: string };
  versus: string;
  hmm: { eyebrow: string; title: string; text: string; result: string };
  compareHead: [string, string, string];
  compareRows: [string, string, string][];
  regimesEyebrow: string;
  regimesTitle: string;
  regimesLead: string;
  statsLine: (days: number, ret: number, vol: number) => string;
  sound: string;
  image: string;
  matrixTitle: string;
  matrixNever: string;
  matrixText: string;
  predictEyebrow: string;
  predictTitle: string;
  predictParas: string[];
  predictQuote: string;
  predictQuoteSource: string;
  toolsEyebrow: string;
  toolsTitle: string;
  toolsLead: string;
  limitsEyebrow: string;
  limitsTitle: string;
  limits: string[];
  disclaimerEyebrow: string;
  disclaimerTitle: string;
  disclaimerText: string;
  toStudio: string;
  glossaryEyebrow: string;
  glossaryTitle: string;
}

export interface Content {
  actors: Actor[];
  episodes: Episode[];
  movements: Movement[];
  features: Feature[];
  tools: Tool[];
  glossary: Term[];
  contextPage: ContextPage;
  methodPage: MethodPage;
}

/** Statistiques des régimes sur le S&P 500 2000-2026 (README §4.4) — jours, rendement et volatilité annualisés. */
export const MOOD_STATS: Record<RegimeId, { days: number; ret: number; vol: number }> = {
  calm: { days: 2346, ret: 0, vol: 0.14 },
  bull: { days: 2290, ret: 0.25, vol: 0.09 },
  nervous: { days: 1742, ret: 0.02, vol: 0.22 },
  panic: { days: 319, ret: -0.59, vol: 0.47 },
};
