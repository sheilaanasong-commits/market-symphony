/**
 * Export de l'œuvre (bonus §2.2) : la toile du Studio en PNG, sur fond papier quadrillé,
 * avec un cartouche (titre, période, signature). Rien n'est envoyé : le fichier est créé
 * dans le navigateur et téléchargé directement.
 */

export interface ExportInfo {
  title: string;
  ticker: string;
  start: string;
  end: string;
  credit: string;
}

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function exportStageAsPng(source: HTMLCanvasElement, info: ExportInfo): Promise<void> {
  const W = source.width, H = source.height; // pixels réels (densité d'écran incluse)
  const k = W / source.clientWidth || 1;
  const pad = 28 * k, band = 64 * k;
  const out = document.createElement("canvas");
  out.width = W + pad * 2;
  out.height = H + pad * 2 + band;
  const g = out.getContext("2d")!;

  // papier + quadrillage
  g.fillStyle = "#fffefb";
  g.fillRect(0, 0, out.width, out.height);
  g.strokeStyle = "#f2ecdf";
  g.lineWidth = 1 * k;
  for (let x = pad; x <= pad + W; x += 28 * k) { g.beginPath(); g.moveTo(x, pad); g.lineTo(x, pad + H); g.stroke(); }
  for (let y = pad; y <= pad + H; y += 28 * k) { g.beginPath(); g.moveTo(pad, y); g.lineTo(pad + W, y); g.stroke(); }

  g.drawImage(source, pad, pad);
  g.strokeStyle = "#e6ded0";
  g.strokeRect(pad, pad, W, H);

  // cartouche
  const y0 = pad + H + band * 0.55;
  g.fillStyle = "#211d1a";
  g.font = `${24 * k}px "Bicubik MS", sans-serif`;
  g.textBaseline = "alphabetic";
  g.fillText(info.title, pad, y0);
  g.font = `${11 * k}px "JetBrains Mono", monospace`;
  g.fillStyle = "#5f5850";
  g.fillText(`${info.ticker} · ${info.start} → ${info.end}`, pad, y0 + 20 * k);
  g.textAlign = "right";
  g.fillText(`MARKET SYMPHONY ♪ ${info.credit}`, pad + W, y0 + 20 * k);

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Export impossible");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `market-symphony-${slug(info.title) || "toile"}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
