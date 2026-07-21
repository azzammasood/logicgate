"use client";

import { HeroCta } from "@/components/marketing/home/HeroCta";
import { HeroTerminal } from "@/components/marketing/home/HeroTerminal";

export function HeroSection() {
  return (
    <section className="hero-section" aria-label="Hero">
      <div className="hero-glow" aria-hidden />
      <div className="hero-content hero-content-split">
        <div className="hero-copy">
          <p className="hero-eyebrow hero-fade-up hero-fade-up-0 marketing-mono">
            Data definition management
          </p>

          <h1
            className="hero-fade-up hero-fade-up-1"
            style={{
              fontFamily:
                'var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace',
              fontWeight: 900,
              fontSize: "clamp(38px, 4.4vw, 58px)",
              letterSpacing: "-1.4px",
              lineHeight: 1.14,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Your data logic deserves a{" "}
            <em className="hero-accent-em">source of truth</em>
          </h1>

          <p
            className="hero-fade-up hero-fade-up-2"
            style={{
              marginTop: 22,
              fontFamily: 'var(--font-inter), "Inter", sans-serif',
              fontSize: 17,
              fontWeight: 400,
              color: "var(--text2)",
              maxWidth: 540,
              lineHeight: 1.7,
            }}
          >
            Stakeholders define metrics visually. Engineers receive compiled code
            automatically. Every change versioned and approved.
          </p>

          <div className="hero-fade-up hero-fade-up-3" style={{ marginTop: 32 }}>
            <HeroCta />
          </div>
        </div>

        <div className="hero-visual">
          <HeroTerminal />
        </div>
      </div>
    </section>
  );
}
