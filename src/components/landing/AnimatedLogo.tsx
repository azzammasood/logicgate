"use client";

import {
  LOGO_ACCENT,
  LOGO_BADGE_GLYPH_ORIGIN,
  LOGO_BADGE_GLYPH_SCALE,
  LOGO_GLYPH_CENTER,
  LOGO_GLYPH_DARK,
} from "@/components/landing/logo-glyph";

type AnimatedLogoProps = {
  className?: string;
  /** Display size in px (badge is square). */
  size?: number;
};

/**
 * Animated badge logo — green rounded square with black glyph (matches LogoBadge).
 */
export function AnimatedLogo({ className, size = 120 }: AnimatedLogoProps) {
  const { x: ox, y: oy } = LOGO_BADGE_GLYPH_ORIGIN;
  const { x: cx, y: cy } = LOGO_GLYPH_CENTER;
  const s = LOGO_BADGE_GLYPH_SCALE;
  const tf = `translate(${ox} ${oy}) scale(${s}) translate(${-cx} ${-cy})`;

  return (
    <div className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className="lg-logo mx-auto block"
        aria-hidden
      >
        <style>{`
          /* Static glow — animating filter every frame is a jank source, so the
             halo stays constant and the life comes from cheap opacity/transform. */
          .lg-logo { filter: drop-shadow(0 0 3px rgba(74, 222, 128, 0.28)); }
          /* Nodes keep a constant size; only their opacity gently breathes. */
          @keyframes lg-core-pulse {
            0%, 100% { opacity: 0.72; }
            50% { opacity: 1; }
          }
          /* A soft expanding ping emitted from the core. */
          @keyframes lg-ping {
            0% { opacity: 0.4; transform: scale(0.6); }
            70%, 100% { opacity: 0; transform: scale(2.2); }
          }
          /* Data flowing along the connectors — cheap stroke-dashoffset only. */
          @keyframes lg-signal-flow {
            to { stroke-dashoffset: -12; }
          }
          @media (prefers-reduced-motion: no-preference) {
            .lg-core {
              animation: lg-core-pulse 2.6s ease-in-out infinite;
              will-change: opacity;
            }
            .lg-ping {
              transform-box: fill-box;
              transform-origin: center;
              animation: lg-ping 2.6s ease-out infinite;
              will-change: opacity, transform;
            }
            .lg-signal {
              stroke-dasharray: 3 3;
              animation: lg-signal-flow 1.6s linear infinite;
              will-change: stroke-dashoffset;
            }
          }
        `}</style>
        <rect width="48" height="48" rx="10" fill={LOGO_ACCENT} />
        <g transform={tf} fill={LOGO_GLYPH_DARK}>
          <rect x="2" y="9" width="6" height="6" rx="1.4" />
          <rect x="16" y="9" width="6" height="6" rx="1.4" />
          <path
            className="lg-signal"
            d="M8 12h8"
            stroke={LOGO_GLYPH_DARK}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            className="lg-ping"
            cx="12"
            cy="4.5"
            r="2.4"
            fill="none"
            stroke={LOGO_GLYPH_DARK}
            strokeWidth="0.7"
          />
          <circle className="lg-core" cx="12" cy="4.5" r="2.4" />
          <path
            className="lg-signal"
            d="M12 6.9V9"
            stroke={LOGO_GLYPH_DARK}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}
