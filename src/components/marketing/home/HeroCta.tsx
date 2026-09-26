"use client";

import Link from "next/link";
import { useSessionUser } from "@/lib/supabase/useSessionUser";

export function HeroCta() {
  const { user } = useSessionUser();

  // Signed in: the nav already says "Continue as <name>", so the hero offers
  // a single dashboard link rather than two buttons to the same place.
  if (user) {
    return (
      <div className="hero-cta-row">
        <Link href="/app/dashboard" className="hero-cta-primary">
          Open your dashboard →
        </Link>
      </div>
    );
  }

  return (
    <div className="hero-cta-row">
      <Link href="/signup" className="hero-cta-primary">
        Start defining →
      </Link>
      <Link href="/login" className="hero-cta-secondary">
        Log in
      </Link>
    </div>
  );
}
