/** Animated LogicGate badge shown during compile loading. */
export function CompileLoaderLogo() {
  return (
    <svg
      className="compile-loader-logo"
      width={36}
      height={36}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect
        className="compile-loader-badge-bg"
        width="48"
        height="48"
        rx="10"
        fill="var(--accent, #4ade80)"
      />
      <g transform="translate(24 25.5) scale(1.72) translate(-12 -9.75)" fill="#0a0c10">
        <rect className="compile-loader-gate-l" x="2" y="9" width="6" height="6" rx="1.4" />
        <rect className="compile-loader-gate-r" x="16" y="9" width="6" height="6" rx="1.4" />
        <path
          className="compile-loader-signal"
          d="M8 12h8"
          stroke="#0a0c10"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <circle className="compile-loader-core" cx="12" cy="4.5" r="2.4" />
        <path
          className="compile-loader-signal"
          d="M12 6.9V9"
          stroke="#0a0c10"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
