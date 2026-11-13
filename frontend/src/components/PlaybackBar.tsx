/** Barre de lecture (F4) : lecture/pause, vitesse, curseur temporel, son. */
import { formatDuration, totalDurationMs } from "../audio/timing";
import { PLAYBACK_SPEEDS } from "../config/constants";
import type { Player } from "../hooks/usePlayer";
import { formatDate } from "../lib/format";
import type { SymphonyDay } from "../types/symphony";

export default function PlaybackBar({ days, player }: { days: SymphonyDay[]; player: Player }) {
  const day = days[player.current];
  return (
    <div className="playback">
      <button
        className="play"
        onClick={player.toggle}
        aria-label={player.playing ? "Pause" : "Lecture"}
        title="Lecture / pause (espace)"
      >
        {player.playing ? "❚❚" : "▶"}
      </button>

      <div className="timeline">
        <input
          type="range"
          min={0}
          max={days.length - 1}
          value={player.current}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label="Position dans la période"
        />
        <div className="timeline-labels">
          <span>{day && formatDate(day.date)}</span>
          <span>
            jour {player.current + 1} / {days.length} · durée {formatDuration(totalDurationMs(days, player.speed))}
          </span>
        </div>
      </div>

      <div className="speeds" role="group" aria-label="Vitesse de lecture">
        {PLAYBACK_SPEEDS.map((s) => (
          <button key={s} className={s === player.speed ? "active" : ""} onClick={() => player.setSpeed(s)} aria-pressed={s === player.speed}>
            ×{s}
          </button>
        ))}
      </div>

      <div className="sound">
        <button
          onClick={() => player.setMuted(!player.muted)}
          aria-label={player.muted ? "Réactiver le son" : "Couper le son"}
          title={player.muted ? "Réactiver le son" : "Couper le son"}
        >
          {player.muted ? "🔇" : "🔊"}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={player.volume}
          onChange={(e) => player.setVolume(Number(e.target.value))}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
