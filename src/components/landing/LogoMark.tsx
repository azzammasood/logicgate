import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LOGO_BADGE_GLYPH_ORIGIN,
  LOGO_BADGE_GLYPH_SCALE,
  LOGO_GLYPH_CENTER,
  LOGO_GLYPH_DARK,
  LOGO_VIEWBOX,
} from "@/components/landing/logo-glyph";
import { LOGO_BADGE_HOVER_STYLES } from "@/components/landing/logo-badge-styles";

type GlyphProps = {
  className?: string;
  color?: string;
};

/** Static LogicGate glyph (24×24). Place inside a coloured square container. */
export function LogoGlyph({ className, color = "currentColor" }: GlyphProps) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} fill="none" aria-hidden>
      <rect x="2" y="9" width="6" height="6" rx="1.4" fill={color} />
      <rect x="16" y="9" width="6" height="6" rx="1.4" fill={color} />
      <path d="M8 12h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="4.5" r="2.4" fill={color} />
      <path d="M12 6.9V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** @deprecated alias */
export function LogoMark(props: GlyphProps) {
  return <LogoGlyph {...props} />;
}

function LogoBadgeSvg({
  box,
  rx,
  animateOnHover,
}: {
  box: number;
  rx: number;
  animateOnHover?: boolean;
}) {
  const { x: ox, y: oy } = LOGO_BADGE_GLYPH_ORIGIN;
  const { x: cx, y: cy } = LOGO_GLYPH_CENTER;
  const s = LOGO_BADGE_GLYPH_SCALE;
  const tf = `translate(${ox} ${oy}) scale(${s}) translate(${-cx} ${-cy})`;

  return (
    <svg viewBox="0 0 48 48" width={box} height={box} className="block" aria-hidden>
      {animateOnHover && <style>{LOGO_BADGE_HOVER_STYLES}</style>}
      <rect
        className={animateOnHover ? "lg-badge-bg" : undefined}
        width="48"
        height="48"
        rx={rx}
        fill="#4ade80"
      />
      <g transform={tf} fill={LOGO_GLYPH_DARK}>
        <rect
          className={animateOnHover ? "lg-gate-left" : undefined}
          x="2"
          y="9"
          width="6"
          height="6"
          rx="1.4"
        />
        <rect
          className={animateOnHover ? "lg-gate-right" : undefined}
          x="16"
          y="9"
          width="6"
          height="6"
          rx="1.4"
        />
        <path
          className={animateOnHover ? "lg-signal" : undefined}
          d="M8 12h8"
          stroke={LOGO_GLYPH_DARK}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          className={animateOnHover ? "lg-core" : undefined}
          cx="12"
          cy="4.5"
          r="2.4"
        />
        <path
          className={animateOnHover ? "lg-signal" : undefined}
          d="M12 6.9V9"
          stroke={LOGO_GLYPH_DARK}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function LogoBadge({
  className,
  size = "md",
  animateOnHover = false,
  href,
}: {
  className?: string;
  size?: "sm" | "md";
  /** Play gate animation while hovered (sidebar logo). */
  animateOnHover?: boolean;
  href?: string;
}) {
  const box = size === "md" ? 36 : 32;
  const rx = size === "md" ? 8 : 7;

  const inner = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        animateOnHover && "lg-badge-interactive rounded-lg transition-opacity hover:opacity-90",
        className
      )}
      style={{ width: box, height: box }}
    >
      <LogoBadgeSvg box={box} rx={rx} animateOnHover={animateOnHover} />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 outline-none" title="LogicGate">
        {inner}
      </Link>
    );
  }

  return inner;
}
