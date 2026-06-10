import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/** Scroll-reveal target; observed by {@link ScrollReveal} in the marketing layout. */
export function Reveal({ children, className = "" }: RevealProps) {
  return <div className={className ? `reveal ${className}` : "reveal"}>{children}</div>;
}
