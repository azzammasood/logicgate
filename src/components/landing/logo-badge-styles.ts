/** Shared keyframes for LogoBadge hover animation (matches AnimatedLogo). */
export const LOGO_BADGE_HOVER_STYLES = `
  @keyframes lg-badge-breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.04); }
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
  .lg-badge-interactive:hover .lg-badge-bg {
    animation: lg-badge-breathe 1.2s ease-in-out infinite;
  }
  .lg-badge-interactive:hover .lg-core {
    animation: lg-core-glow 1.2s ease-in-out infinite;
  }
  .lg-badge-interactive:hover .lg-signal {
    stroke-dasharray: 10;
    animation: lg-signal-flow 1.2s ease-in-out infinite;
  }
  .lg-badge-interactive:hover .lg-gate-left {
    animation: lg-gate-left 1.2s ease-in-out infinite;
  }
  .lg-badge-interactive:hover .lg-gate-right {
    animation: lg-gate-right 1.2s ease-in-out infinite;
  }
`;
