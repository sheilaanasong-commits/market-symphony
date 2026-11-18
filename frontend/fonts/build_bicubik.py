"""Construit la police de titres du site à partir de Bicubik (Anton Kudin, Freeware).

Bicubik est une capitale géométrique sans aucune lettre accentuée. Ce script ajoute, dans le style
de la police (trait de 100 unités, angles droits), les accents nécessaires au français :
É È Ê Ë À Â Ç Ô Ù Û Î Ï Œ — les minuscules accentuées pointent vers les mêmes glyphes,
puisque la police n'a que des capitales.

    backend/.venv/Scripts/python frontend/fonts/build_bicubik.py

Sortie : frontend/public/fonts/bicubik-ms.woff (famille « Bicubik MS »).
"""

from __future__ import annotations

from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
SRC = HERE / "Bicubik.otf"
OUT = HERE.parent / "public" / "fonts" / "bicubik-ms.woff"

CAP, LOW, HIGH = 700, 770, 905  # hauteur des capitales ; bande verticale des accents


def poly(pen, pts):
    pen.moveTo(pts[0])
    for p in pts[1:]:
        pen.lineTo(p)
    pen.closePath()


# Accents dessinés autour de l'axe cx (unités de la police)
def acute(pen, cx):
    poly(pen, [(cx - 75, LOW), (cx + 25, LOW), (cx + 125, HIGH), (cx + 25, HIGH)])


def grave(pen, cx):
    poly(pen, [(cx - 25, LOW), (cx + 75, LOW), (cx - 25, HIGH), (cx - 125, HIGH)])


def circumflex(pen, cx):
    poly(pen, [(cx - 190, LOW), (cx - 75, LOW), (cx, LOW + 70), (cx + 75, LOW), (cx + 190, LOW), (cx + 55, HIGH), (cx - 55, HIGH)])


def diaeresis(pen, cx):
    for x0 in (cx - 175, cx + 75):
        poly(pen, [(x0, LOW), (x0 + 100, LOW), (x0 + 100, LOW + 100), (x0, LOW + 100)])


def cedilla(pen, cx):
    poly(pen, [(cx - 50, 0), (cx + 50, 0), (cx + 50, -200), (cx - 140, -200), (cx - 140, -110), (cx - 50, -110)])


ACCENTED = {  # caractère : (glyphe de base, accent)
    "À": ("A", grave), "Â": ("A", circumflex), "Ä": ("A", diaeresis),
    "Ç": ("C", cedilla),
    "É": ("E", acute), "È": ("E", grave), "Ê": ("E", circumflex), "Ë": ("E", diaeresis),
    "Î": ("I", circumflex), "Ï": ("I", diaeresis), "Í": ("I", acute),
    "Ô": ("O", circumflex), "Ö": ("O", diaeresis), "Ó": ("O", acute),
    "Ù": ("U", grave), "Û": ("U", circumflex), "Ü": ("U", diaeresis), "Ú": ("U", acute),
    "Á": ("A", acute), "Ñ": ("N", None),  # Ñ : tilde dessiné à part ci-dessous
}


def tilde(pen, cx):
    poly(pen, [(cx - 190, LOW), (cx - 90, LOW), (cx - 90, LOW + 45), (cx + 90, LOW + 45), (cx + 90, LOW), (cx + 190, LOW),
               (cx + 190, HIGH - 30), (cx + 90, HIGH - 30), (cx + 90, HIGH - 75), (cx - 90, HIGH - 75), (cx - 90, HIGH - 30), (cx - 190, HIGH - 30)])


def main() -> None:
    src = TTFont(SRC)
    gs = src.getGlyphSet()
    cmap = dict(src.getBestCmap())
    order = list(src.getGlyphOrder())
    hmtx = dict(src["hmtx"].metrics)

    charstrings: dict[str, object] = {}
    for name in order:
        pen = T2CharStringPen(hmtx[name][0], gs)
        gs[name].draw(pen)
        charstrings[name] = pen.getCharString()

    def stem_center(base: str) -> float:
        bp = BoundsPen(gs)
        gs[base].draw(bp)
        x0, _, x1, _ = bp.bounds
        return (x0 + x1) / 2

    for ch, (base_char, accent) in ACCENTED.items():
        base = cmap[ord(base_char)]
        name = f"uni{ord(ch):04X}"
        pen = T2CharStringPen(hmtx[base][0], gs)
        gs[base].draw(pen)
        (accent or tilde)(pen, stem_center(base))
        charstrings[name] = pen.getCharString()
        hmtx[name] = hmtx[base]
        order.append(name)
        cmap[ord(ch)] = name
        cmap[ord(ch.lower())] = name  # pas de bas-de-casse distinct dans Bicubik

    # Œ : le O et le E partagent un même fût vertical
    o, e = cmap[ord("O")], cmap[ord("E")]
    shift = 590
    pen = T2CharStringPen(shift + hmtx[e][0], gs)
    gs[o].draw(pen)
    gs[e].draw(TransformPen(pen, (1, 0, 0, 1, shift, 0)))
    charstrings["uni0152"] = pen.getCharString()
    hmtx["uni0152"] = (shift + hmtx[e][0], hmtx[o][1])
    order.append("uni0152")
    cmap[0x152] = cmap[0x153] = "uni0152"

    fb = FontBuilder(src["head"].unitsPerEm, isTTF=False)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupCFF("BicubikMS-Regular", {"FullName": "Bicubik MS", "FamilyName": "Bicubik MS", "Weight": "Regular"}, charstrings, {})
    fb.setupHorizontalMetrics(hmtx)
    fb.setupHorizontalHeader(ascent=src["hhea"].ascent, descent=src["hhea"].descent)
    fb.setupOS2(sTypoAscender=src["hhea"].ascent, sTypoDescender=src["hhea"].descent, usWinAscent=src["hhea"].ascent,
                usWinDescent=-src["hhea"].descent, sCapHeight=CAP, achVendID="NONE")
    fb.setupNameTable({
        "familyName": "Bicubik MS",
        "styleName": "Regular",
        "copyright": "Copyright (c) 2010 by Anton Kudin. Freeware. Accents ajoutés pour Market Symphony (2026).",
        "description": "Bicubik d'Anton Kudin, augmentée des accents français pour le site Market Symphony.",
    })
    fb.setupPost()
    for table in ("kern", "GPOS"):  # l'approche (crénage) d'origine est conservée : mêmes noms de glyphes
        if table in src:
            fb.font[table] = src[table]
    fb.font.flavor = "woff"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    fb.save(OUT)
    print(f"{OUT} — {OUT.stat().st_size / 1024:.1f} Ko, {len(order)} glyphes")


if __name__ == "__main__":
    main()
