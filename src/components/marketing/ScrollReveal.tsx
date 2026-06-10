"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
};

export function ScrollReveal({ children }: ScrollRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reveals = root.querySelectorAll<HTMLElement>(".reveal");
    if (reveals.length === 0) return;

    const observer = new IntersectionObserver(
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
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
