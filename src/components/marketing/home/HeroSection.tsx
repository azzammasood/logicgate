import { WaitlistForm } from "@/components/marketing/home/WaitlistForm";
import { HeroTerminal } from "@/components/marketing/home/HeroTerminal";

export function HeroSection() {
  return (
    <section className="hero-section" aria-label="Hero">
      <div className="hero-grid-overlay" aria-hidden />
      <div className="hero-glow" aria-hidden />
      <div className="hero-content">
        <h1
          className="hero-fade-up hero-fade-up-0"
          style={{
            fontFamily: "Satoshi, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(48px, 7vw, 88px)",
            letterSpacing: "-3.5px",
            lineHeight: 1.03,
            color: "#eef0f6",
            margin: 0,
            maxWidth: 900,
          }}
        >
          Your data logic deserves a{" "}
          <em className="hero-gradient-em">source of truth</em>
        </h1>

        <p
          className="hero-fade-up hero-fade-up-1"
          style={{
            marginTop: 22,
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: 17,
            fontWeight: 400,
            color: "#8892a4",
            maxWidth: 460,
            lineHeight: 1.7,
          }}
        >
          Stakeholders define metrics visually. Engineers receive compiled code
          automatically. Every change versioned and approved.
        </p>

        <div className="hero-fade-up hero-fade-up-2 waitlist-wrap" style={{ marginTop: 32 }}>
          <WaitlistForm />
        </div>

        <HeroTerminal />
      </div>
    </section>
  );
}
