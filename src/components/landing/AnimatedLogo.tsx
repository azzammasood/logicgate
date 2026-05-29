"use client";

export function AnimatedLogo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="mx-auto text-[var(--accent,#4ade80)]"
        aria-hidden
      >
        <style>{`
          @keyframes lg-pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          @keyframes lg-flow {
            0% { stroke-dashoffset: 24; opacity: 0.3; }
            50% { stroke-dashoffset: 0; opacity: 1; }
            100% { stroke-dashoffset: -24; opacity: 0.3; }
          }
          @keyframes lg-gate-left {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-3px); }
          }
          @keyframes lg-gate-right {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(3px); }
          }
          .lg-core { animation: lg-pulse 2.5s ease-in-out infinite; }
          .lg-wire {
            stroke-dasharray: 24;
            animation: lg-flow 2s ease-in-out infinite;
          }
          .lg-left { animation: lg-gate-left 2.5s ease-in-out infinite; }
          .lg-right { animation: lg-gate-right 2.5s ease-in-out infinite; }
        `}</style>
        <rect
          className="lg-left"
          x="18"
          y="45"
          width="28"
          height="30"
          rx="4"
          fill="currentColor"
          opacity="0.85"
        />
        <rect
          className="lg-right"
          x="74"
          y="45"
          width="28"
          height="30"
          rx="4"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          className="lg-wire"
          d="M46 60 H74"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        <circle className="lg-core" cx="60" cy="32" r="8" fill="currentColor" />
      </svg>
    </div>
  );
}
