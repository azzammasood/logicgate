/** Shared keyframes for LogoBadge hover animation (matches AnimatedLogo). */
export const LOGO_BADGE_HOVER_STYLES = `
  /* Nodes hold a constant size/position — only opacity breathes, so nothing
     shifts or "falls" on hover. */
  @keyframes lg-core-pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  @keyframes lg-signal-flow {
    to { stroke-dashoffset: -12; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .lg-badge-interactive:hover .lg-core {
      animation: lg-core-pulse 1.6s ease-in-out infinite;
    }
    .lg-badge-interactive:hover .lg-signal {
      stroke-dasharray: 3 3;
      animation: lg-signal-flow 1.4s linear infinite;
    }
  }
`;
