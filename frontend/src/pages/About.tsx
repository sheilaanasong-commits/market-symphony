/** Page Méthode : quoi, comment, pourquoi — le pipeline, les modèles, les outils, les limites, le lexique. */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import MoodArt from "../components/ui/MoodArt";
import GlitchText from "../components/ui/GlitchText";
import { Barcode, Receipt, Row, Sep } from "../components/ui/Receipt";
import { REGIME_COLORS } from "../config/constants";
import { FEATURES, GLOSSARY, MOODS, MOVEMENTS, TOOLS } from "../content/method";

const TRANSITIONS = `   ┌──────────┐      ┌────────┐      ┌─────────┐      ┌─────────┐
   │ HAUSSIER │ ◄──► │ CALME  │ ◄──► │ NERVEUX │ ◄──► │ PANIQUE │
   └──────────┘      └────────┘      └─────────┘      └─────────┘
        ▲                                                  │
        └──────────────────── ✗ jamais direct ─────────────┘`;

export default function About() {
  return (
    <main className="page">
      {/* ------------------------------------------------------------ Ouverture */}
      <section className="program">
        <div className="section">
          <div className="section-head">
            <span className="eyebrow">Méthode · dans les coulisses</span>
            <h1 className="display">
              Ouvrir le <em>capot</em> de la <GlitchText text="symphonie">symphonie</GlitchText>.
            </h1>
            <p className="lead">
              Comment une machine peut-elle « entendre » la peur d'un marché ? Réponse en trois questions, cinq
              mouvements et quelques métaphores — sans équation, promis.
            </p>
          </div>
          <div className="grid-3">
            <article className="card">
              <span className="eyebrow">Quoi ?</span>
              <p>
                Une application web qui <strong>traduit l'historique des prix en musique et en image</strong>,
                en s'appuyant sur un modèle d'IA qui reconnaît l'humeur de chaque séance.
              </p>
            </article>
            <article className="card">
              <span className="eyebrow">Comment ?</span>
              <p>
                Des données publiques, six mesures par jour, un <strong>modèle de Markov caché</strong>, puis une
                table de correspondance entre chiffres, notes et formes.
              </p>
            </article>
            <article className="card">
              <span className="eyebrow">Pourquoi ?</span>
              <p>
                Parce qu'un graphique s'observe mais qu'une musique <strong>se ressent</strong>. L'oreille
                perçoit d'instinct la différence entre une berceuse et une alarme.
              </p>
            </article>
          </div>
        </div>
        <Receipt>
          <div className="r-title r-line">FICHE TECHNIQUE</div>
          <div className="r-small r-line">ATELIER MARKET SYMPHONY</div>
          <Sep />
          <Row i={2} label="Séances d'entraînement" value="6 697" />
          <Row i={3} label="Années de S&P 500" value="26" />
          <Row i={4} label="Mesures par séance" value="6" />
          <Row i={5} label="Régimes découverts" value="4" />
          <Row i={6} label="Durée moy. d'un régime" value="31,4 j" />
          <Row i={7} label="Panique détectée 2008" value="100 %" />
          <Row i={8} label="Panique détectée 2020" value="100 %" />
          <Row i={9} label="Tests automatiques" value="27" />
          <Sep double />
          <Row i={10} bold label="Prédictions de prix" value="0" />
          <Sep />
          <div className="r-center r-line" style={{ "--i": 11 } as CSSProperties}>
            DÉCRIRE, PAS PRÉDIRE
          </div>
          <Barcode seed={42} />
          <div className="r-small">graine aléatoire : 42</div>
        </Receipt>
      </section>

      {/* ------------------------------------------------------------- Pipeline */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Le pipeline</span>
          <h2 className="title">
            Une symphonie en <em>cinq mouvements</em>
          </h2>
          <p className="lead">
            Du téléchargement des prix jusqu'au son dans vos écouteurs, chaque étape passe le relais à la
            suivante, comme les mouvements d'une œuvre classique.
          </p>
        </div>
        <div className="pipeline">
          {MOVEMENTS.map((m) => (
            <article className="card movement" key={m.num}>
              <span className="num">
                {m.num} · {m.tempo}
              </span>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <p className="figure" style={{ fontSize: "1rem" }}>
                {m.figure}
              </p>
              <code>{m.tech}</code>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Mesures */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Mouvement II · les mesures</span>
          <h2 className="title">
            Six façons de <em>prendre le pouls</em> du marché
          </h2>
          <p className="lead">
            Le modèle ne voit pas des courbes : il voit, pour chaque jour, une fiche de six nombres. Les voici,
            avec leur image et leur rôle dans la musique.
          </p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mesure</th>
                <th>Ce qu'elle calcule</th>
                <th>En image</th>
                <th>Dans la symphonie</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.name}>
                  <td>
                    <strong>{f.name}</strong>
                    <br />
                    <span className="mono muted">{f.col}</span>
                  </td>
                  <td>{f.what}</td>
                  <td>
                    <em>{f.figure}</em>
                  </td>
                  <td>{f.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------- Modèles */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Mouvement III · les modèles</span>
          <h2 className="title">
            Deux élèves, une <em>même dictée</em>
          </h2>
          <p className="lead">
            Personne n'a dit à la machine ce qu'est un krach. On lui a donné 26 ans de fiches et une consigne :
            « range-les en quatre familles ». C'est l'<strong>apprentissage non supervisé</strong>. Deux
            méthodes ont concouru.
          </p>
        </div>
        <div className="vs">
          <article className="card">
            <span className="eyebrow">Modèle de référence</span>
            <h3>K-Means</h3>
            <p>
              Il range chaque jour dans la famille dont il est le plus proche, <strong>sans tenir compte de la
              veille</strong>. Tel un trieur de billes qui jugerait chaque bille isolément.
            </p>
            <p>
              Résultat : rapide et lisible, mais versatile. Il change d'avis tous les 5,7 jours en moyenne et
              qualifie à tort près de la moitié de 2022 de « haussière ».
            </p>
          </article>
          <span className="vs-sep">contre</span>
          <article className="card" style={{ borderColor: "var(--ink)" }}>
            <span className="eyebrow">Modèle retenu</span>
            <h3>Modèle de Markov caché</h3>
            <p>
              Il suppose qu'un <strong>état invisible</strong> — l'humeur du marché — produit ce que l'on observe,
              et qu'une humeur a tendance à durer. Comme on devine la saison derrière une fenêtre en regardant
              les passants : manteaux, parapluies, lunettes de soleil.
            </p>
            <p>
              Résultat : des régimes qui durent 31 jours en moyenne, et 100 % de panique reconnue à
              l'automne 2008 comme en mars 2020.
            </p>
          </article>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Épreuve</th>
                <th>K-Means</th>
                <th>Markov caché</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Panique sept.–nov. 2008</td><td>80 %</td><td><strong>100 %</strong></td></tr>
              <tr><td>Panique mars 2020</td><td>73 %</td><td><strong>100 %</strong></td></tr>
              <tr><td>2017, marché haussier</td><td>100 % « calme »</td><td><strong>93 % haussier</strong></td></tr>
              <tr><td>2022, marché baissier</td><td>46 % « haussier » ✗</td><td><strong>76 % nerveux</strong></td></tr>
              <tr><td>Durée moyenne d'un régime</td><td>5,7 jours</td><td><strong>31,4 jours</strong></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------ Régimes */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Ce que le modèle a découvert</span>
          <h2 className="title">
            Quatre <em>saisons</em>, et les chemins qui les relient
          </h2>
          <p className="lead">
            Une fois les familles formées, il faut les nommer. La règle est simple : la plus agitée devient la{" "}
            <em>panique</em>, la plus rentable pour un risque donné le <em>haussier</em>, la plus agitée des
            deux restantes le <em>nerveux</em>, la dernière le <em>calme</em>.
          </p>
        </div>
        <div className="grid-4">
          {MOODS.map((m) => (
            <article className="card mood" key={m.id} style={{ "--regime": REGIME_COLORS[m.id] } as CSSProperties}>
              <MoodArt regime={m.id} height={120} />
              <h3>{m.label}</h3>
              <p className="mono" style={{ fontSize: "0.78rem" }}>
                {m.stats.days} · {m.stats.ret} · volatilité {m.stats.vol}
              </p>
              <p>
                <strong>Son :</strong> {m.sound}.<br />
                <strong>Image :</strong> {m.visual}.
              </p>
            </article>
          ))}
        </div>
        <div className="ascii-frame">
          <header>
            <span>MATRICE DE TRANSITION · LECTURE SIMPLIFIÉE</span>
            <span>HMM · S&amp;P 500</span>
          </header>
          <pre className="ascii matrix" style={{ overflowX: "auto" }}>{TRANSITIONS}</pre>
        </div>
        <p className="prose">
          La matrice de transition — le tableau des probabilités de passer d'une humeur à l'autre — dessine
          une échelle. Un marché haussier ne sombre jamais directement dans la panique, et une panique ne
          s'achève qu'en traversant une phase nerveuse : <strong>la tempête ne laisse jamais place au grand
          soleil sans une éclaircie hésitante</strong>.
        </p>
      </section>

      {/* -------------------------------------------------------- Prédiction */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Et la prédiction ?</span>
          <h2 className="title">
            Un <em>sismographe</em>, pas une boule de cristal
          </h2>
        </div>
        <div className="grid-2">
          <div className="prose">
            <p>
              Market Symphony <strong>ne prédit aucun prix</strong>. Le modèle décrit l'humeur d'un jour à partir
              de ce qui s'est déjà produit ; il ne dit rien du lendemain.
            </p>
            <p>
              Ce choix est délibéré. Selon l'hypothèse d'<strong>efficience des marchés</strong>, popularisée par
              Burton Malkiel dans <em>A Random Walk Down Wall Street</em> (1973), les prix intègrent déjà
              l'information disponible : leurs variations futures ressemblent aux pas d'un promeneur égaré.
            </p>
            <p>
              Le sismographe ne prévoit pas les séismes ; il les enregistre avec une précision qui permet de les
              comprendre. C'est exactement l'ambition de ce projet.
            </p>
          </div>
          <p className="figure">
            Prédire la Bourse, c'est vouloir lire l'avenir dans le marc de café ; la décrire, c'est apprendre à
            reconnaître l'orage quand il gronde.
            <small>Le parti pris du projet</small>
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- Outils */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">La boîte à outils</span>
          <h2 className="title">
            Les <em>instruments</em> de l'orchestre
          </h2>
          <p className="lead">
            Tous gratuits et libres. Le modèle est entraîné une fois, hors ligne ; le serveur ne fait ensuite que
            l'appliquer, et le navigateur joue le résultat.
          </p>
        </div>
        <div className="tool-grid">
          {TOOLS.map((t) => (
            <div className="tool" key={t.name}>
              <span className="layer-tag">{t.layer}</span>
              <b>{t.name}</b>
              <span>{t.role}</span>
              <i>{t.figure}</i>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- Limites */}
      <section className="grid-2">
        <div className="section">
          <div className="section-head">
            <span className="eyebrow">Limites</span>
            <h2 className="title">
              Ce que la symphonie <em>ne dit pas</em>
            </h2>
          </div>
          <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
            <li><strong>Descriptif, pas prédictif</strong> : les régimes résument le passé.</li>
            <li><strong>Quatre états imposés</strong> : un choix d'interprétation et de musicalité, pas une vérité de la nature.</li>
            <li><strong>Entraîné sur le S&amp;P 500</strong> : appliqué au Bitcoin, bien plus volatil, il n'entend que nervosité et panique.</li>
            <li><strong>Une note par jour</strong> : les secousses d'une séance (flash crash) passent presque inaperçues.</li>
            <li><strong>Avant 1960</strong>, pas de volume fourni : l'intensité des notes reste constante sur 1929.</li>
          </ul>
        </div>
        <div className="card" style={{ alignSelf: "start" }}>
          <span className="eyebrow">Avertissement</span>
          <h3>Projet éducatif</h3>
          <p>
            Market Symphony est un projet de portfolio réalisé dans le cadre du MSc IA &amp; Data Science
            d'Aivancity. Il ne constitue en aucun cas un conseil en investissement.
          </p>
          <Link className="btn small" to="/studio">
            Passer au Studio →
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- Lexique */}
      <section className="section" id="lexique">
        <div className="section-head">
          <span className="eyebrow">Lexique</span>
          <h2 className="title">
            Les <em>mots</em> de la Bourse et de la machine
          </h2>
        </div>
        <dl className="glossary">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt>{g.term}</dt>
              <dd>{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
