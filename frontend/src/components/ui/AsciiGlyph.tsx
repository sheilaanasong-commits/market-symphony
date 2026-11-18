/** Petite animation ASCII qui illustre l'humeur d'un régime (calme, haussier, nerveux, panique). */
import { useRef, type CSSProperties } from "react";
import { REGIME_COLORS, type RegimeId } from "../../config/constants";
import { useAnimationClock } from "../../hooks/useAnimationClock";
import { REGIME_ASCII } from "../../visual/ascii";

export default function AsciiGlyph({ regime, rows = 5, cols = 28, fps = 8 }: { regime: RegimeId; rows?: number; cols?: number; fps?: number }) {
  const ref = useRef<HTMLPreElement>(null);
  useAnimationClock(ref, (t) => {
    if (ref.current) ref.current.textContent = REGIME_ASCII[regime](t, rows, cols);
  }, fps);
  return <pre ref={ref} className="ascii ascii-glyph" style={{ "--regime": REGIME_COLORS[regime] } as CSSProperties} aria-hidden="true" />;
}
