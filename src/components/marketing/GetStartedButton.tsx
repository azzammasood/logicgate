"use client";

import Link from "next/link";
import { useSessionUser } from "@/lib/supabase/useSessionUser";

type GetStartedButtonProps = {
  /** Label shown to signed-out visitors. */
  label?: string;
  /** Extra classes appended to the base CTA class. */
  className?: string;
};

/**
 * Marketing CTA that adapts to auth state: signed-out visitors are sent to the
 * sign-up page; an existing session turns it into a "Continue as …" shortcut
 * straight into the app.
 */
export function GetStartedButton({
  label = "Get started",
  className = "",
}: GetStartedButtonProps) {
  const { user } = useSessionUser();

  if (user) {
    const firstName = user.name.split(" ")[0];
    return (
      <Link href="/app/dashboard" className={`marketing-cta ${className}`.trim()}>
        Continue as {firstName} →
      </Link>
    );
  }

  return (
    <Link href="/signup" className={`marketing-cta ${className}`.trim()}>
      {label}
    </Link>
  );
}
