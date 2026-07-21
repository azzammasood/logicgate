"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarketingLogo } from "@/components/marketing/MarketingLogo";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Accountability", href: "/accountability" },
  { label: "Security", href: "/security" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`marketing-nav${scrolled ? " is-scrolled" : ""}`}
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
      <GetStartedButton className="shrink-0" />
    </header>
  );
}
