/** Canonical LogicGate glyph paths (24×24 viewBox). */
export const LOGO_VIEWBOX = "0 0 24 24";

/** Visual centre for scaling / centring the glyph. */
export const LOGO_GLYPH_CENTER = { x: 12, y: 9.75 };

export const LOGO_ACCENT = "#4ade80";
export const LOGO_GLYPH_DARK = "#0a0c10";

/** Scale applied inside the 48×48 badge (fills ~78% of the square). */
export const LOGO_BADGE_GLYPH_SCALE = 1.72;

/** Centroid used when placing the glyph inside the badge. */
export const LOGO_BADGE_GLYPH_ORIGIN = { x: 24, y: 25.5 };

export function logoBadgeGlyphTransform() {
  const { x: ox, y: oy } = LOGO_BADGE_GLYPH_ORIGIN;
  const { x: cx, y: cy } = LOGO_GLYPH_CENTER;
  const s = LOGO_BADGE_GLYPH_SCALE;
  return `translate(${ox} ${oy}) scale(${s}) translate(${-cx} ${-cy})`;
}
