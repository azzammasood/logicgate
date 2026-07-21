import Link from "next/link";
import { MarketingLogo } from "@/components/marketing/MarketingLogo";

const PRODUCT_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Security", href: "/security" },
] as const;

const COMPANY_LINKS = [
  { label: "Contact", href: "mailto:ahmaduzzammasood@gmail.com" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Story", href: "/story" },
] as const;

export function Footer() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-grid">
        <div className="marketing-footer-brand">
          <MarketingLogo />
          <p className="marketing-footer-tagline">
            Data definition management for teams that need one source of truth
            for metrics and business rules.
          </p>
        </div>

        <div>
          <p className="marketing-footer-col-title">Product</p>
          <nav className="marketing-footer-col-links" aria-label="Product">
            {PRODUCT_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="marketing-footer-link">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="marketing-footer-col-title">Company</p>
          <nav className="marketing-footer-col-links" aria-label="Company">
            {COMPANY_LINKS.map(({ label, href }) =>
              href.startsWith("mailto:") ? (
                <a key={href} href={href} className="marketing-footer-link">
                  {label}
                </a>
              ) : (
                <Link key={href} href={href} className="marketing-footer-link">
                  {label}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>

      <div className="marketing-footer-bottom">
        <p
          className="m-0"
          style={{
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: 12,
            color: "var(--text3)",
          }}
        >
          © 2026 LogicGate
        </p>
        <a href="mailto:ahmaduzzammasood@gmail.com" className="marketing-footer-link">
          ahmaduzzammasood@gmail.com
        </a>
      </div>
    </footer>
  );
}
