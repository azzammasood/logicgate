import { Reveal } from "@/components/marketing/Reveal";

const STEPS = [
  {
    num: "1",
    title: "Stakeholder defines",
    body: "Uses visual dropdowns and condition blocks. No SQL. No ambiguity.",
  },
  {
    num: "2",
    title: "Engineer reviews",
    body: "Inspects the change, approves or requests clarification with a written note.",
  },
  {
    num: "3",
    title: "LogicGate compiles",
    body: "Definition auto-compiles to SQL, Python, or dbt. Versioned and timestamped.",
  },
  {
    num: "4",
    title: "Pipeline stays consistent",
    body: "Copy output into your pipeline. No logic drift. No surprise revisions.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how" className="marketing-section-container">
      <Reveal>
        <p className="marketing-eyebrow">HOW IT WORKS</p>
      </Reveal>
      <Reveal>
        <h2 className="marketing-section-h2">
          From scattered requirement to compiled code
        </h2>
      </Reveal>

      <div style={{ position: "relative", marginTop: 52 }}>
        <div
          className="how-connector"
          aria-hidden
          style={{
            position: "absolute",
            top: 23,
            left: "calc(12.5% + 8px)",
            right: "calc(12.5% + 8px)",
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 15%, rgba(255,255,255,0.12) 85%, transparent 100%)",
          }}
        />

        <div
          className="how-steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
          }}
        >
          {STEPS.map((step, i) => (
            <Reveal key={step.num}>
              <div
                className="how-step"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "0 12px",
                }}
              >
                <div className="how-step-circle">{step.num}</div>
                <h3
                  style={{
                    marginTop: 20,
                    marginBottom: 0,
                    fontFamily: "Satoshi, sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#eef0f6",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    fontFamily: 'var(--font-inter), "Inter", sans-serif',
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#8892a4",
                    lineHeight: 1.65,
                  }}
                >
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
