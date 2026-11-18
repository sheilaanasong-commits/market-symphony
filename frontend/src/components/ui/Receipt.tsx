/** Ticket de caisse : bords dentelés, lignes pointillées, code-barres. S'imprime à l'apparition. */
import type { CSSProperties, ReactNode } from "react";
import { hash } from "../../visual/ascii";

export function Receipt({ children, className = "", print = true }: { children: ReactNode; className?: string; print?: boolean }) {
  return (
    <div className="receipt-wrap">
      <div className={`receipt ${print ? "printing" : ""} ${className}`}>{children}</div>
    </div>
  );
}

/** Ligne « libellé ........ valeur ». `i` règle le délai d'impression de la ligne. */
export function Row({ label, value, i = 0, style, bold }: { label: ReactNode; value: ReactNode; i?: number; style?: CSSProperties; bold?: boolean }) {
  return (
    <div className={`r-row r-line ${bold ? "r-total" : ""}`} style={{ "--i": i, ...style } as CSSProperties}>
      <span className="r-label">{label}</span>
      <span className="r-fill" />
      <span className="r-value">{value}</span>
    </div>
  );
}

export function Sep({ double = false }: { double?: boolean }) {
  return <hr className={`r-sep ${double ? "double" : ""}`} />;
}

/** Code-barres décoratif dérivé d'une graine (même graine → même code). */
export function Barcode({ seed = 1 }: { seed?: number }) {
  const stops: string[] = [];
  let x = 0;
  for (let k = 0; x < 100; k++) {
    const bar = 0.6 + hash(seed * 13 + k) * 1.8;
    const gap = 0.5 + hash(seed * 7 + k * 3) * 1.4;
    stops.push(`var(--ink) ${x.toFixed(2)}% ${(x + bar).toFixed(2)}%`, `transparent ${(x + bar).toFixed(2)}% ${(x + bar + gap).toFixed(2)}%`);
    x += bar + gap;
  }
  return <div className="barcode" style={{ background: `linear-gradient(90deg, ${stops.join(", ")})` }} aria-hidden="true" />;
}

/** Barre de proportion en caractères pleins / vides (ex. ███████░░░). */
export function asciiBar(share: number, width = 12): string {
  const full = Math.round(Math.min(Math.max(share, 0), 1) * width);
  return "█".repeat(full) + "░".repeat(width - full);
}
