import Link from "next/link";

type MarketingLogoProps = {
  badgeSize?: number;
  href?: string;
};

export function MarketingLogo({ badgeSize = 26, href = "/" }: MarketingLogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-2.5 no-underline outline-none"
      aria-label="LogicGate home"
    >
      <svg width={badgeSize} height={badgeSize} viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect width="48" height="48" rx="10" fill="#4ade80" />
        <g transform="translate(24 25.5) scale(1.72) translate(-12 -9.75)" fill="#0a0c10">
          <rect x="2" y="9" width="6" height="6" rx="1.4" />
          <rect x="16" y="9" width="6" height="6" rx="1.4" />
          <path
            d="M8 12h8"
            stroke="#0a0c10"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="12" cy="4.5" r="2.4" />
          <path
            d="M12 6.9V9"
            stroke="#0a0c10"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
      <span
        className="text-[15px] leading-none text-[var(--text)]"
        style={{ fontFamily: 'var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace', fontWeight: 700 }}
      >
        LogicGate
      </span>
    </Link>
  );
}
