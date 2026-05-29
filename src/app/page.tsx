import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[var(--background,#0d0f14)] px-6">
      <AnimatedLogo />
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-syne)] text-5xl font-bold text-[var(--accent,#4ade80)]">
          LogicGate
        </h1>
        <p className="mt-4 max-w-md text-sm text-white/60">
          Visually define data metrics and business rules with version control,
          approvals, and auto-compiled pseudocode.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className={cn(buttonVariants(), "bg-[var(--accent,#4ade80)] text-black hover:opacity-90")}
        >
          Get started
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
          Sign in
        </Link>
      </div>
    </main>
  );
}
