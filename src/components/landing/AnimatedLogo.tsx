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
        className="mx-auto block"
        aria-hidden
      >
        <style>{`
          @keyframes lg-badge-breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }
          @keyframes lg-core-glow {
            0%, 100% { opacity: 0.88; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.12); }
          }
          @keyframes lg-signal-flow {
            0% { stroke-dashoffset: 10; opacity: 0.45; }
            50% { stroke-dashoffset: 0; opacity: 1; }
            100% { stroke-dashoffset: -10; opacity: 0.45; }
          }
          @keyframes lg-gate-left {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-0.35px); }
          }
          @keyframes lg-gate-right {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(0.35px); }
          }
          .lg-badge-bg {
            transform-origin: 24px 24px;
            animation: lg-badge-breathe 3s ease-in-out infinite;
          }
          .lg-core {
            transform-origin: 12px 4.5px;
            animation: lg-core-glow 2.4s ease-in-out infinite;
          }
          .lg-signal {
            stroke-dasharray: 10;
            animation: lg-signal-flow 1.8s ease-in-out infinite;
          }
          .lg-gate-left {
            transform-origin: 5px 12px;
            animation: lg-gate-left 2.4s ease-in-out infinite;
          }
          .lg-gate-right {
            transform-origin: 19px 12px;
            animation: lg-gate-right 2.4s ease-in-out infinite;
          }
        `}</style>
        <rect
          className="lg-badge-bg"
          width="48"
          height="48"
          rx="10"
          fill={LOGO_ACCENT}
        />
        <g transform={tf} fill={LOGO_GLYPH_DARK}>
          <rect className="lg-gate-left" x="2" y="9" width="6" height="6" rx="1.4" />
          <rect className="lg-gate-right" x="16" y="9" width="6" height="6" rx="1.4" />
          <path
            className="lg-signal"
            d="M8 12h8"
            stroke={LOGO_GLYPH_DARK}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
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
