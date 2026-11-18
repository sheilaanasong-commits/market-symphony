/**
 * Contenu éditorial (français) de la page « Contexte » : les acteurs des marchés et les épisodes sonifiés.
 * Les chiffres marqués « (données) » sont calculés sur les séries du projet (public/presets) ;
 * les autres sont des faits historiques de référence.
 */
import type { Actor, Episode } from "./types";

export const ACTORS: Actor[] = [
  {
    role: "Places de cotation",
    name: "Les bourses",
    examples: ["NYSE (1792)", "Nasdaq (1971)", "Euronext Paris"],
    text: "Elles organisent la rencontre des acheteurs et des vendeurs et publient les prix. Le New York Stock Exchange est né en 1792 sous un platane de Wall Street ; le Nasdaq, fondé en 1971, fut le premier marché entièrement électronique.",
    metaphor: "Les salles de concert : sans elles, pas de représentation.",
  },
  {
    role: "Fournisseurs d'indices",
    name: "Les architectes d'indices",
    examples: ["S&P Dow Jones Indices", "MSCI", "FTSE Russell"],
    text: "Ils composent des paniers de valeurs représentatifs. Le S&P 500, lancé le 4 mars 1957, réunit environ 500 des plus grandes entreprises américaines pondérées par leur capitalisation flottante, soit près de 80 % de la valeur du marché actions des États-Unis.",
    metaphor: "Les chefs de pupitre qui choisissent quels musiciens jouent.",
  },
  {
    role: "Banques centrales",
    name: "Les gardiens de la monnaie",
    examples: ["Réserve fédérale (Fed, 1913)", "BCE (1998)", "Banque d'Angleterre"],
    text: "En fixant le loyer de l'argent — les taux directeurs — et en injectant ou retirant des liquidités, elles accélèrent ou freinent l'économie. Chaque grande crise s'achève, en partie, par leur intervention.",
    metaphor: "Le chef d'orchestre : il ne joue d'aucun instrument, mais impose le tempo.",
  },
  {
    role: "Régulateurs",
    name: "Les arbitres",
    examples: ["SEC (1934)", "CFTC (1974)", "AMF (2003)"],
    text: "Ils veillent à l'intégrité et à la transparence des marchés : information des investisseurs, lutte contre les manipulations et les délits d'initié. La SEC américaine est elle-même une enfant du krach de 1929.",
    metaphor: "Les gardiens du règlement, sifflet aux lèvres.",
  },
  {
    role: "Investisseurs institutionnels",
    name: "Les grands gérants",
    examples: ["BlackRock", "Vanguard", "Fonds de pension", "Assureurs"],
    text: "Ils gèrent l'épargne de millions de personnes et détiennent l'essentiel des actions. Leurs décisions, par leur masse, déplacent les cours ; la gestion indicielle (acheter tout l'indice) a fait d'eux des actionnaires de presque toutes les grandes entreprises.",
    metaphor: "Les grandes sections de cordes : quand elles changent de nuance, toute la salle l'entend.",
  },
  {
    role: "Banques d'investissement et teneurs de marché",
    name: "Les intermédiaires",
    examples: ["Goldman Sachs", "JPMorgan Chase", "Morgan Stanley", "Citadel Securities"],
    text: "Elles conseillent les entreprises, placent les nouvelles actions et assurent la liquidité : un teneur de marché affiche en permanence un prix d'achat et un prix de vente, pour que chacun trouve une contrepartie.",
    metaphor: "Les accordeurs : invisibles quand tout va bien, indispensables quand tout se dérègle.",
  },
  {
    role: "Agences de notation",
    name: "Les juges de la dette",
    examples: ["S&P Global Ratings", "Moody's", "Fitch"],
    text: "Elles évaluent la capacité d'un emprunteur à rembourser (de AAA à D). En 2008, leurs notes trop généreuses sur des produits adossés aux crédits immobiliers à risque ont largement contribué à la crise.",
    metaphor: "Les critiques musicaux — dont une mauvaise critique peut vider une salle.",
  },
  {
    role: "Entreprises cotées",
    name: "Les musiciens",
    examples: ["Apple", "Microsoft", "Nvidia", "Amazon", "Alphabet", "Meta"],
    text: "Ce sont elles que l'on achète et que l'on vend. Ces dernières années, une poignée de géants technologiques pèse à elle seule près d'un tiers du S&P 500 : quand ils toussent, l'indice s'enrhume.",
    metaphor: "Les solistes, dont la moindre fausse note s'entend jusqu'au dernier rang.",
  },
  {
    role: "Particuliers",
    name: "Le public",
    examples: ["Courtiers en ligne", "Robinhood", "Boursorama"],
    text: "Longtemps spectateurs, ils accèdent désormais au marché depuis leur téléphone. En janvier 2021, l'épisode GameStop a montré qu'une foule coordonnée sur les réseaux sociaux pouvait faire vaciller des fonds spéculatifs.",
    metaphor: "Le public qui, parfois, monte sur scène.",
  },
];

export const EPISODES: Episode[] = [
  {
    presetId: "crash_1929",
    year: "1929",
    title: "Le Grand Krach",
    period: "Octobre 1929 — juillet 1932",
    regime: "panic",
    summary:
      "Au terme des « Années folles », la Bourse de New York vit à crédit : on achète des actions « sur marge » en n'en payant qu'une fraction, tandis que des fonds d'investissement à fort effet de levier se multiplient. Le jeudi 24 octobre, la confiance se fissure ; un consortium de banquiers tente d'endiguer la chute en achetant ostensiblement, en vain. Les 28 et 29 octobre, la digue cède. Le marché perdra près de 86 % jusqu'en 1932 et la crise financière se muera en Grande Dépression.",
    causes: ["Spéculation financée par l'emprunt (achat sur marge)", "Resserrement monétaire de la Fed en 1928-1929", "Fragilité bancaire et absence de filet de sécurité"],
    actors: ["J.P. Morgan & Co.", "Richard Whitney (NYSE)", "Réserve fédérale", "Goldman Sachs Trading Corp."],
    facts: [
      { value: "−12,9 %", label: "le 28 octobre 1929 (données)" },
      { value: "+12,5 %", label: "rebond du 30 octobre (données)" },
      { value: "−86 %", label: "du sommet de 1929 au creux de 1932" },
      { value: "1934", label: "création de la SEC, en réponse" },
    ],
    listen:
      "Un été en mode majeur, puis l'automne bascule dans la dissonance : 69 séances de panique sur 270. Le modèle n'a jamais vu 1929 pendant son entraînement, et le reconnaît pourtant.",
  },
  {
    presetId: "black_monday_1987",
    year: "1987",
    title: "Le Lundi noir",
    period: "19 octobre 1987",
    regime: "panic",
    summary:
      "Après une envolée de plus de 30 % depuis janvier, le marché américain est tendu : taux d'intérêt en hausse, déficit commercial préoccupant, valorisations élevées. Le 19 octobre, une vague de ventes s'auto-alimente, amplifiée par l'« assurance de portefeuille », stratégie informatisée qui vend automatiquement des contrats à terme quand le marché baisse. En une seule séance, le S&P 500 perd plus d'un cinquième de sa valeur : un record jamais égalé depuis.",
    causes: ["Ventes programmées par ordinateur (assurance de portefeuille)", "Hausse des taux longs", "Valorisations tendues après une année euphorique"],
    actors: ["Alan Greenspan (Fed)", "Chicago Mercantile Exchange", "Commission Brady", "NYSE"],
    facts: [
      { value: "−20,5 %", label: "le 19 octobre, en une séance (données)" },
      { value: "+9,1 %", label: "le 21 octobre, rebond (données)" },
      { value: "−33,5 %", label: "du sommet d'août au 4 décembre (données)" },
      { value: "1988", label: "naissance des coupe-circuits boursiers" },
    ],
    listen: "Le basculement est d'une brutalité saisissante : du 15 octobre au 30 novembre, 100 % des séances sont classées en panique.",
  },
  {
    presetId: "dotcom_2000",
    year: "2000",
    title: "L'éclatement de la bulle Internet",
    period: "Mars 2000 — octobre 2002",
    regime: "nervous",
    summary:
      "La « nouvelle économie » promet un monde transformé par Internet. Des entreprises sans bénéfices s'introduisent en Bourse à des valorisations vertigineuses ; le Nasdaq quintuple en cinq ans et culmine le 10 mars 2000. Puis l'argent se raréfie, les promesses tardent, et les faillites s'enchaînent. Les scandales comptables d'Enron (2001) et de WorldCom (2002) achèvent d'éroder la confiance.",
    causes: ["Survalorisation des valeurs technologiques", "Hausse des taux de la Fed en 1999-2000", "Fraudes comptables révélées en 2001-2002"],
    actors: ["Pets.com", "Cisco", "AOL – Time Warner", "Amazon", "Enron", "WorldCom"],
    facts: [
      { value: "−49,1 %", label: "S&P 500, mars 2000 → octobre 2002 (données)" },
      { value: "−78 %", label: "Nasdaq, du sommet au creux" },
      { value: "568 / 902", label: "séances en régime nerveux (données)" },
      { value: "2002", label: "loi Sarbanes-Oxley sur la transparence comptable" },
    ],
    listen: "Moins un fracas qu'un long decrescendo : la gamme mineure s'installe pendant plus de deux ans, entrecoupée de brèves paniques.",
  },
  {
    presetId: "subprime_2008",
    year: "2008",
    title: "La crise des subprimes",
    period: "Octobre 2007 — mars 2009",
    regime: "panic",
    summary:
      "Des millions de crédits immobiliers accordés à des ménages fragiles (« subprimes ») sont découpés, regroupés et revendus sous forme de titres réputés sûrs. Quand les prix de l'immobilier se retournent, la mécanique s'enraye : personne ne sait plus qui détient les pertes. Bear Stearns est sauvée in extremis en mars 2008 ; le 15 septembre, Lehman Brothers fait faillite — la plus grande de l'histoire américaine. Le lendemain, l'assureur AIG doit être secouru. La panique devient mondiale.",
    causes: ["Crédits immobiliers à risque et titrisation opaque", "Endettement excessif des banques", "Notations trop complaisantes"],
    actors: ["Lehman Brothers", "Bear Stearns", "AIG", "Fannie Mae & Freddie Mac", "Merrill Lynch", "Ben Bernanke (Fed)", "Henry Paulson (Trésor)"],
    facts: [
      { value: "−56,8 %", label: "du 9 oct. 2007 au 9 mars 2009 (données)" },
      { value: "−9,0 %", label: "le 15 octobre 2008 (données)" },
      { value: "+11,6 %", label: "le 13 octobre 2008 (données)" },
      { value: "700 Md$", label: "plan de sauvetage TARP (oct. 2008)" },
    ],
    listen: "Septembre à novembre 2008 : 100 % de panique. Le tempo s'emballe, les éclats rouges envahissent la toile — puis la gamme mineure revient, épuisée.",
  },
  {
    presetId: "flash_2010",
    year: "2010",
    title: "Le Flash Crash",
    period: "6 mai 2010",
    regime: "panic",
    summary:
      "Sur fond de crise de la dette grecque, un ordre de vente massif de contrats à terme sur le S&P 500 rencontre un marché dominé par des algorithmes à haute fréquence. En quelques minutes, le Dow Jones chute d'environ 9 % ; certaines actions s'échangent un centime, d'autres à 100 000 $. Trente-six minutes plus tard, l'essentiel des pertes est effacé.",
    causes: ["Ordre de vente géant exécuté sans limite de prix", "Retrait soudain des teneurs de marché automatisés", "Manipulations par ordres fictifs (« spoofing »)"],
    actors: ["Waddell & Reed", "Traders haute fréquence", "Navinder Singh Sarao", "SEC & CFTC"],
    facts: [
      { value: "≈ −9 %", label: "Dow Jones, en quelques minutes" },
      { value: "36 min", label: "pour effacer l'essentiel de la chute" },
      { value: "−3,2 %", label: "seulement à la clôture du 6 mai (données)" },
      { value: "−16 %", label: "jusqu'au 2 juillet, crise européenne (données)" },
    ],
    listen:
      "Une leçon d'humilité : à l'échelle d'une note par jour, l'éclair du 6 mai n'est qu'une mauvaise séance. Ce que l'on entend surtout, c'est la nervosité des semaines suivantes.",
  },
  {
    presetId: "covid_2020",
    year: "2020",
    title: "Le krach du Covid-19",
    period: "19 février — 23 mars 2020",
    regime: "panic",
    summary:
      "Le 19 février, le S&P 500 inscrit un record. Un mois plus tard, l'économie mondiale est à l'arrêt : confinements, usines fermées, avions cloués au sol. Jamais le marché n'avait perdu un tiers de sa valeur aussi vite. Mais la riposte est tout aussi inédite : taux ramenés à zéro, rachats d'actifs illimités par la Fed, plan budgétaire de 2 200 milliards de dollars. Le 18 août, l'indice retrouve son sommet.",
    causes: ["Pandémie et arrêt brutal de l'activité", "Ventes forcées et course à la liquidité", "Incertitude sanitaire totale"],
    actors: ["OMS", "Jerome Powell (Fed)", "Congrès américain (CARES Act)", "Zoom", "Moderna", "Compagnies aériennes"],
    facts: [
      { value: "−33,9 %", label: "en 23 séances (données)" },
      { value: "−12,0 %", label: "le 16 mars 2020 (données)" },
      { value: "4 fois", label: "coupe-circuits déclenchés en mars" },
      { value: "18 août", label: "retour au record d'avant-crise" },
    ],
    listen: "Un concert en trois actes : un hiver haussier, un mois de mars apocalyptique, puis le retour progressif de la gamme pentatonique dès l'été.",
  },
  {
    presetId: "bull_2017",
    year: "2017",
    title: "Le calme plat",
    period: "Janvier — décembre 2017",
    regime: "bull",
    summary:
      "Contrepoint indispensable aux krachs : une année d'une sérénité presque irréelle. Croissance mondiale synchronisée, bénéfices en hausse, réforme fiscale américaine en fin d'année. Le S&P 500 progresse chaque mois en rendement total — une première — et l'indice de volatilité VIX touche des plus bas historiques. Ce calme s'achèvera brutalement en février 2018.",
    causes: ["Croissance mondiale synchronisée", "Politique monétaire très graduelle", "Baisse d'impôts sur les sociétés (déc. 2017)"],
    actors: ["Janet Yellen (Fed)", "Apple", "Amazon", "Facebook", "Netflix", "Alphabet"],
    facts: [
      { value: "+18,4 %", label: "sur l'année (données)" },
      { value: "−2,8 %", label: "pire repli de l'année (données)" },
      { value: "233 / 251", label: "séances en régime haussier (données)" },
      { value: "−1,8 %", label: "pire séance de l'année (données)" },
    ],
    listen: "La pentatonique lumineuse, presque sans interruption. C'est l'étalon : écoutez-le avant un krach pour mesurer le contraste.",
  },
  {
    presetId: "btc_2021",
    year: "2021",
    title: "Les montagnes russes du Bitcoin",
    period: "Octobre 2020 — juin 2022",
    regime: "nervous",
    summary:
      "Porté par l'arrivée d'investisseurs institutionnels et d'entreprises, le Bitcoin passe d'environ 10 000 $ à plus de 67 000 $. Tesla annonce un achat de 1,5 milliard de dollars, Coinbase entre au Nasdaq, le Salvador en fait une monnaie légale. Puis les vents tournent : interdiction du minage en Chine, hausse des taux, effondrement de l'écosystème Terra-Luna. En juin 2022, le cours a perdu plus de 70 %.",
    causes: ["Afflux de capitaux spéculatifs et institutionnels", "Revirements réglementaires (Chine)", "Remontée des taux et faillites en cascade (Terra, Celsius)"],
    actors: ["Tesla", "MicroStrategy", "Coinbase", "Salvador", "Terra-Luna", "Celsius"],
    facts: [
      { value: "+18,7 %", label: "le 8 févr. 2021, annonce de Tesla (données)" },
      { value: "67 567 $", label: "clôture record du 8 nov. 2021 (données)" },
      { value: "−71,9 %", label: "du sommet au 18 juin 2022 (données)" },
      { value: "0", label: "séance « calme » : la limite du modèle (données)" },
    ],
    listen:
      "Un modèle entraîné sur le S&P 500 juge le Bitcoin à l'aune des actions : il n'y entend que nervosité et panique. Une limite assumée, et une belle leçon sur la relativité du risque.",
  },
];
