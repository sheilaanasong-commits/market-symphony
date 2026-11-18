/** Texte « datamosh » : deux copies décalées (rouge / bleu) traversent le texte par tranches, quelques fois par minute. */
import type { ElementType, ReactNode } from "react";

export default function GlitchText({ text, as: Tag = "span", className = "", children }: {
  text: string;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={`glitch ${className}`} data-text={text}>
      {children ?? text}
    </Tag>
  );
}
