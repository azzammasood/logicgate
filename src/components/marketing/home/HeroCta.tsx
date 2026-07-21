"use client";

import Link from "next/link";
import { useSessionUser } from "@/lib/supabase/useSessionUser";

export function HeroCta() {
  const { user } = useSessionUser();

  if (user) {
    const firstName = user.name.split(" ")[0];
    return (
      <div className="hero-cta-row">
        <Link href="/app/dashboard" className="hero-cta-primary">
          Continue as {firstName} →
        </Link>
        <Link href="/app/dashboard" className="hero-cta-secondary">
          Go to dashboard
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
