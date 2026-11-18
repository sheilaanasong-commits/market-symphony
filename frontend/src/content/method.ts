/**
 * Contenu éditorial (français) de la page « Méthode » : pipeline, mesures, outils, lexique.
 */
import type { Feature, Movement, Term, Tool } from "./types";

/** Les cinq mouvements du pipeline, à la manière d'une symphonie. */
export const MOVEMENTS: Movement[] = [
  {
    num: "I",
    tempo: "Allegro",
    title: "Collecter",
    text: "Télécharger l'historique des prix (S&P 500 depuis 1927, actions, Bitcoin) avec yfinance, puis le ranger dans un cache Parquet.",
    figure: "Comme un musicien qui accorde son instrument avant le concert : sans données propres, aucune mélodie juste.",
    tech: "yfinance · pandas · Parquet",
  },
  {
    num: "II",
    tempo: "Andante",
    title: "Décrire",
    text: "Transformer chaque séance en six mesures : rendement, volatilité, élan sur 20 et 60 jours, distance au sommet, volume relatif.",
    figure: "On ne décrit pas la mer par la hauteur d'une seule vague, mais par sa houle, ses courants et ses marées.",
    tech: "pandas · numpy",
  },
  {
    num: "III",
    tempo: "Adagio",
    title: "Comprendre",
    text: "Un modèle de Markov caché (HMM) apprend, sans qu'on lui souffle la réponse, à regrouper 26 ans de séances en quatre humeurs.",
    figure: "Tel un médecin qui devine la fièvre à partir des symptômes, le modèle déduit un état invisible de ce qu'il observe.",
    tech: "scikit-learn · hmmlearn",
  },
  {
    num: "IV",
    tempo: "Scherzo",
    title: "Traduire",
    text: "Chaque jour devient une note (hauteur = rendement, tempo = volatilité, intensité = volume) et une particule (forme, taille, couleur).",
    figure: "Une partition : le marché écrit, l'algorithme transcrit, le navigateur interprète.",
    tech: "FastAPI · Pydantic",
  },
  {
    num: "V",
    tempo: "Finale",
    title: "Jouer",
    text: "Le navigateur joue la partition en direct : Tone.js pour le son, p5.js pour la toile générative, Lightweight Charts pour la courbe.",
    figure: "La salle s'éteint, le rideau se lève : chaque krach a désormais une voix.",
    tech: "React · Tone.js · p5.js",
  },
];

export const FEATURES: Feature[] = [
  { name: "Rendement", col: "log_return", what: "Variation du prix d'un jour à l'autre.", figure: "Le pas du jour : en avant ou en arrière ?", role: "Hauteur de la note" },
  { name: "Volatilité", col: "volatility", what: "Amplitude des variations sur 20 séances, annualisée.", figure: "La houle : mer d'huile ou creux de dix mètres.", role: "Tempo, réverbération, taille" },
  { name: "Momentum", col: "momentum_20 / 60", what: "Rendement cumulé sur 20 et 60 séances.", figure: "L'élan du cycliste : continue-t-il sur sa lancée ?", role: "Aide à reconnaître le régime" },
  { name: "Drawdown", col: "drawdown", what: "Distance au plus haut des douze derniers mois.", figure: "La profondeur sous le sommet, comme un alpiniste qui mesure sa descente.", role: "Aide à reconnaître la panique" },
  { name: "Volume relatif", col: "relative_volume", what: "Volume échangé rapporté à sa moyenne sur 20 jours.", figure: "Le brouhaha de la foule : murmure ou clameur.", role: "Intensité de la note, luminosité" },
];

export const TOOLS: Tool[] = [
  { name: "Python 3.11", layer: "Langage", role: "Toute la partie données et modèles.", figure: "La langue commune de l'atelier." },
  { name: "yfinance", layer: "Données", role: "Télécharge l'historique depuis Yahoo Finance.", figure: "Le facteur qui apporte les partitions." },
  { name: "pandas · numpy", layer: "Données", role: "Nettoyage, calculs sur séries temporelles.", figure: "L'établi et ses outils de précision." },
  { name: "Parquet", layer: "Stockage", role: "Cache local compact et rapide.", figure: "Le classeur où l'on range les archives." },
  { name: "scikit-learn", layer: "Modèle", role: "K-Means (modèle de référence), standardisation.", figure: "Le trieur qui range les billes par couleur." },
  { name: "hmmlearn", layer: "Modèle", role: "Modèle de Markov caché à 4 états.", figure: "Le détective qui reconstitue l'invisible." },
  { name: "joblib", layer: "Modèle", role: "Sauvegarde des modèles entraînés.", figure: "Le congélateur : on entraîne une fois, on sert à volonté." },
  { name: "FastAPI · Pydantic", layer: "Serveur", role: "API web typée et validée.", figure: "Le guichet qui vérifie chaque commande." },
  { name: "pytest", layer: "Qualité", role: "Tests automatiques.", figure: "Le contrôle technique avant chaque départ." },
  { name: "React · TypeScript · Vite", layer: "Interface", role: "Pages, composants, compilation.", figure: "La scène, ses décors et ses machinistes." },
  { name: "Tone.js", layer: "Son", role: "Synthétiseurs, réverbération, rythme.", figure: "L'orchestre de poche du navigateur." },
  { name: "p5.js", layer: "Image", role: "Toile générative animée.", figure: "Le pinceau qui peint au rythme de la musique." },
  { name: "Lightweight Charts", layer: "Image", role: "Courbe des prix et bandes de régime.", figure: "La carte routière du voyage." },
];

export const GLOSSARY: Term[] = [
  { term: "Action", def: "Titre de propriété représentant une fraction du capital d'une entreprise." },
  { term: "Indice boursier", def: "Panier de valeurs dont l'évolution résume celle d'un marché (S&P 500, CAC 40)." },
  { term: "Capitalisation", def: "Valeur boursière d'une entreprise : nombre d'actions × cours." },
  { term: "Ticker", def: "Code mnémonique d'une valeur cotée : AAPL pour Apple, ^GSPC pour le S&P 500." },
  { term: "Rendement", def: "Gain ou perte relative sur une période ; ici en logarithme, pour pouvoir l'additionner." },
  { term: "Volatilité", def: "Amplitude des fluctuations d'un prix, principale mesure du risque." },
  { term: "Drawdown", def: "Perte subie depuis le dernier plus haut ; mesure de la profondeur d'une baisse." },
  { term: "Liquidité", def: "Facilité à acheter ou vendre un actif rapidement sans en altérer le prix." },
  { term: "Marché haussier / baissier", def: "Phase de hausse durable (bull) / de baisse d'au moins 20 % (bear)." },
  { term: "Bulle spéculative", def: "Envolée des prix déconnectée de la valeur fondamentale, nourrie par l'anticipation de nouvelles hausses." },
  { term: "Krach", def: "Effondrement brutal et généralisé des cours, souvent en quelques séances." },
  { term: "Effet de levier", def: "Recours à l'emprunt pour amplifier une position : il multiplie les gains comme les pertes." },
  { term: "Titrisation", def: "Transformation de créances (crédits immobiliers…) en titres négociables." },
  { term: "Coupe-circuit", def: "Suspension automatique des échanges lorsqu'une baisse dépasse un seuil." },
  { term: "Efficience des marchés", def: "Hypothèse selon laquelle les prix intègrent déjà toute l'information disponible." },
  { term: "Marche aléatoire", def: "Idée que les variations futures sont imprévisibles, comme les pas d'un promeneur égaré." },
  { term: "Régime de marché", def: "Phase durable aux caractéristiques stables (tendance, volatilité)." },
  { term: "Apprentissage non supervisé", def: "Méthode où la machine découvre seule des groupes, sans exemples étiquetés." },
  { term: "Modèle de Markov caché", def: "Modèle où un état invisible (le régime) produit les observations et passe d'un état à l'autre selon des probabilités." },
  { term: "Matrice de transition", def: "Tableau des probabilités de passer d'un régime à un autre d'un jour au suivant." },
  { term: "BIC", def: "Critère qui arbitre entre la fidélité d'un modèle et sa complexité, pour éviter le surapprentissage." },
  { term: "Sonification", def: "Traduction de données en son, pour les percevoir par l'oreille." },
];
