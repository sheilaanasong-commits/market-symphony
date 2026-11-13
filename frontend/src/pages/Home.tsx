import { Link } from "react-router-dom";
import { HERO_PRESET_ID } from "../config/constants";

export default function Home() {
  return (
    <main className="page">
      <h1>Market Symphony</h1>
      <p>Écoutez et regardez le marché : chaque séance devient une note, chaque régime une ambiance.</p>
      {/* Le son ne démarre qu'après un clic (exigence d'accessibilité §8) */}
      <Link to={`/studio?preset=${HERO_PRESET_ID}`}>Écouter le krach de 2008</Link>
    </main>
  );
}
