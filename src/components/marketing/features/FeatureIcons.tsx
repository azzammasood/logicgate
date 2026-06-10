const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "#4ade80",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function LogicGateIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="13" width="6" height="6" rx="1.2" />
      <rect x="15" y="13" width="6" height="6" rx="1.2" />
      <path d="M9 16h6" />
      <circle cx="12" cy="6" r="2.2" />
      <path d="M12 8.2V13" />
    </svg>
  );
}

export function WaveformIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 12h2l2-5 3 10 3-14 3 9 2-5h2" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function DocumentIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M16 4v4h4" />
      <path d="M8 11h8M8 15h6" />
    </svg>
  );
}

export function OwnershipIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z" />
    </svg>
  );
}

export function PackageIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3z" />
      <path d="M3 7.5V16.5L12 21l9-4.5V7.5" />
      <path d="M12 12v9" />
    </svg>
  );
}
