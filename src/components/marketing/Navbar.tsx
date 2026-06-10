import Link from "next/link";
import { MarketingLogo } from "@/components/marketing/MarketingLogo";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Accountability", href: "/accountability" },
  { label: "Security", href: "/security" },
] as const;

export function Navbar() {
  return (
    <header
      style={{
        height: 62,
        padding: "0 44px",
        background: "transparent",
      }}
      className="flex shrink-0 items-center justify-between"
    >
      <div className="flex min-w-0 flex-1 items-center gap-10">
        <MarketingLogo />
        <nav className="marketing-nav-links" aria-label="Primary">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href} className="marketing-nav-link">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <Link href="/#waitlist" className="marketing-cta shrink-0">
        Join waitlist
      </Link>
    </header>
  );
}
