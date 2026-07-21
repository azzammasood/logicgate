"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type ScrollRevealProps = {
  children: ReactNode;
};

export function ScrollReveal({ children }: ScrollRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let observer: IntersectionObserver | null = null;

    const setup = () => {
      observer?.disconnect();

      const reveals = root.querySelectorAll<HTMLElement>(".reveal:not(.visible)");
      if (reveals.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            const el = entry.target as HTMLElement;
            const parent = el.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children).filter((child) =>
                child.classList.contains("reveal")
              );
              const index = siblings.indexOf(el);
              if (index >= 0) {
                el.style.transitionDelay = `${index * 55}ms`;
              }
            }

            el.classList.add("visible");
            observer?.unobserve(el);
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
      );

      reveals.forEach((el) => observer?.observe(el));
    };

    const frame = requestAnimationFrame(setup);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname]);

  return <div ref={rootRef}>{children}</div>;
}
