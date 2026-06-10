import Link from "next/link";
import { MarketingLogo } from "@/components/marketing/MarketingLogo";

const FOOTER_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Accountability", href: "/accountability" },
  { label: "Security", href: "/security" },
  { label: "Docs", href: "/docs" },
] as const;

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "40px 44px",
      }}
    >
      <div
        className="mx-auto flex flex-wrap items-center justify-between gap-6"
        style={{ maxWidth: 1060 }}
      >
        <MarketingLogo />
        <nav
          className="flex flex-wrap items-center gap-6"
          aria-label="Footer"
        >
          {FOOTER_LINKS.map(({ label, href }) => (
            <Link key={href} href={href} className="marketing-footer-link">
              {label}
            </Link>
          ))}
        </nav>
        <p
          className="m-0 shrink-0"
          style={{
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: 12,
            color: "#4a5268",
          }}
        >
          © 2026 LogicGate
        </p>
      </div>
    </footer>
  );
}
