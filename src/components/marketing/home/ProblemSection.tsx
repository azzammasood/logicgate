import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/Reveal";

const WITHOUT_ITEMS = [
  "Monthly revenue = all transactions in the billing month",
  "Actually, exclude chargebacks as well",
  "Remove internal test accounts too",
  "I mentioned this in last week's review",
  "No record. No version. Pipeline breaks in production.",
] as const;

function ProblemLine({
  children,
  strikethrough,
  color,
}: {
  children: ReactNode;
  strikethrough?: boolean;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#181c27",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 7,
        padding: "9px 13px",
        fontFamily: 'var(--font-inter), "Inter", sans-serif',
        fontSize: 13,
        color,
        textDecoration: strikethrough ? "line-through" : "none",
        textDecorationColor: strikethrough
          ? "rgba(248,113,113,0.4)"
          : undefined,
      }}
    >
      {children}
    </div>
  );
}

function ProblemCard({
  accentGradient,
  dotColor,
  label,
  labelColor,
  children,
}: {
  accentGradient: string;
  dotColor: string;
  label: string;
  labelColor: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "#12151e",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        padding: 28,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 2,
          margin: "-28px -28px 24px",
          background: accentGradient,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
          fontFamily: 'var(--font-inter), "Inter", sans-serif',
          fontSize: 11,
          fontWeight: 600,
          color: labelColor,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dotColor,
            flexShrink: 0,
          }}
        />
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

export function ProblemSection() {
  return (
    <section id="problem" className="marketing-section-container">
      <Reveal>
        <p className="marketing-eyebrow">THE PROBLEM</p>
      </Reveal>
      <Reveal>
        <h2 className="marketing-section-h2">Logic with no home breaks pipelines</h2>
      </Reveal>
      <Reveal>
        <p className="marketing-section-body">
          When data definitions exist only in meetings and documents, stakeholders
          keep revising them informally — and pipelines silently drift.
        </p>
      </Reveal>

      <div
        className="problem-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 52,
        }}
      >
        <Reveal>
          <ProblemCard
            accentGradient="linear-gradient(90deg, #f87171 0%, transparent 70%)"
            dotColor="#f87171"
            label="WITHOUT LOGICGATE"
            labelColor="#f87171"
          >
            {WITHOUT_ITEMS.map((line, i) => (
              <ProblemLine
                key={line}
                strikethrough={i < 4}
                color={i < 4 ? "#4a5268" : "#f87171"}
              >
                {line}
              </ProblemLine>
            ))}
          </ProblemCard>
        </Reveal>

        <Reveal>
          <ProblemCard
            accentGradient="linear-gradient(90deg, #4ade80 0%, transparent 70%)"
            dotColor="#4ade80"
            label="WITH LOGICGATE"
            labelColor="#4ade80"
          >
            <ProblemLine color="#8892a4">
              <strong style={{ color: "#eef0f6", fontWeight: 600 }}>Ayesha R.</strong>{" "}
              updated Monthly Active Revenue
            </ProblemLine>
            <ProblemLine color="#8892a4">
              Change:{" "}
              <em className="marketing-mono" style={{ fontStyle: "normal" }}>
                type NOT IN [&quot;chargeback&quot;]
              </em>
            </ProblemLine>
            <ProblemLine color="#8892a4">
              Reason:{" "}
              <em style={{ fontStyle: "italic" }}>
                &quot;Finance audit requires chargeback exclusion from MRR&quot;
              </em>
            </ProblemLine>
            <ProblemLine color="#8892a4">
              Approved by:{" "}
              <strong style={{ color: "#eef0f6", fontWeight: 600 }}>
                Dawood L. — VP Data
              </strong>
            </ProblemLine>
            <ProblemLine color="#4ade80">
              Every change logged. Pseudocode auto-updated.
            </ProblemLine>
          </ProblemCard>
        </Reveal>
      </div>
    </section>
  );
}
