import type { Metadata } from "next";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Accountability",
  description:
    "Every definition edit is permanently logged — who changed it, when, why, and who signed off.",
};

type AvatarStyle = {
  initials: string;
  background: string;
  border: string;
  color: string;
};

type TimelineEntry = {
  avatar: AvatarStyle;
  name: string;
  action: string;
  target: string;
  time: string;
  change: string;
  borderColor: string;
};

const TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    avatar: {
      initials: "AR",
      background: "rgba(96,165,250,0.12)",
      border: "rgba(96,165,250,0.25)",
      color: "#60a5fa",
    },
    name: "Ayesha R.",
    action: "updated",
    target: "Monthly Active Revenue",
    time: "Today, 2:14 PM · v4.2",
    change: "+ Added chargeback exclusion to refund rule",
    borderColor: "#fbbf24",
  },
  {
    avatar: {
      initials: "DL",
      background: "rgba(74,222,128,0.10)",
      border: "rgba(74,222,128,0.25)",
      color: "#4ade80",
    },
    name: "Dawood L.",
    action: "approved",
    target: "change request #47",
    time: "Today, 2:31 PM",
    change: "✓ Approved — 'Finance audit sign-off received'",
    borderColor: "#4ade80",
  },
  {
    avatar: {
      initials: "MK",
      background: "rgba(167,139,250,0.10)",
      border: "rgba(167,139,250,0.25)",
      color: "#a78bfa",
    },
    name: "Maryam K.",
    action: "restored",
    target: "Active User to v3.1",
    time: "Yesterday, 4:50 PM · v3.2",
    change: "↩ Reverted incorrect 90-day window to 30 days",
    borderColor: "#a78bfa",
  },
  {
    avatar: {
      initials: "HA",
      background: "rgba(251,191,36,0.10)",
      border: "rgba(251,191,36,0.25)",
      color: "#fbbf24",
    },
    name: "Hassan A.",
    action: "created",
    target: "Enterprise Tier definition",
    time: "3 days ago · v1.0",
    change: "+ New segment: ARR > 50k, plan = 'enterprise'",
    borderColor: "#60a5fa",
  },
];

const WORKFLOW_STEPS = [
  {
    num: "1",
    title: "Stakeholder proposes",
    body: "Submits a change with a mandatory reason field. The current and proposed states are saved side-by-side.",
    badgeBg: "rgba(251,191,36,0.12)",
    badgeBorder: "rgba(251,191,36,0.3)",
    badgeColor: "#fbbf24",
  },
  {
    num: "2",
    title: "Engineer reviews diff",
    body: "Sees exactly which fields changed. Can approve, reject, or request clarification with a written note.",
    badgeBg: "rgba(96,165,250,0.12)",
    badgeBorder: "rgba(96,165,250,0.3)",
    badgeColor: "#60a5fa",
  },
  {
    num: "3",
    title: "Change is published",
    body: "Approved changes apply atomically. A new version snapshot is created. Pseudocode updates automatically.",
    badgeBg: "rgba(74,222,128,0.12)",
    badgeBorder: "rgba(74,222,128,0.3)",
    badgeColor: "#4ade80",
  },
] as const;

function AuditEntry({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="audit-entry">
      <div
        className="audit-avatar"
        style={{
          background: entry.avatar.background,
          border: `1px solid ${entry.avatar.border}`,
          color: entry.avatar.color,
        }}
      >
        {entry.avatar.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: 13,
            color: "#eef0f6",
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 500 }}>{entry.name}</span>{" "}
          <span style={{ color: "#8892a4" }}>{entry.action}</span>{" "}
          {entry.target}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: 11,
            color: "#4a5268",
          }}
        >
          {entry.time}
        </p>
        <div
          style={{
            marginTop: 6,
            background: "#0d0f16",
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: `2px solid ${entry.borderColor}`,
            borderRadius: 6,
            padding: "8px 12px",
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: 12,
            color: "#8892a4",
            lineHeight: 1.5,
          }}
        >
          {entry.change}
        </div>
      </div>
    </div>
  );
}

export default function AccountabilityPage() {
  return (
    <div className="marketing-page">
      <Reveal>
        <p className="marketing-eyebrow">ACCOUNTABILITY</p>
      </Reveal>
      <Reveal>
        <h1 className="marketing-page-h1">Every change has a name and a reason</h1>
      </Reveal>
      <Reveal>
        <p className="marketing-subtitle">
          No more &apos;I thought we agreed on that.&apos; Every definition edit is
          permanently logged — who, when, why, and who signed off.
        </p>
      </Reveal>

      <Reveal>
        <div className="audit-timeline-card">
          <div className="audit-timeline-header">
            <h2
              style={{
                margin: 0,
                fontFamily: "Satoshi, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#eef0f6",
              }}
            >
              Live audit log
            </h2>
            <div className="audit-timeline-header-status">
              <span className="audit-live-dot" aria-hidden />
              <span>Updates in real time</span>
            </div>
          </div>

          <div>
            {TIMELINE_ENTRIES.map((entry) => (
              <AuditEntry key={`${entry.name}-${entry.time}`} entry={entry} />
            ))}
          </div>
        </div>
      </Reveal>

      <div className="features-compile-layout">
        <div>
          <Reveal>
            <p className="marketing-eyebrow">CHANGE REQUESTS</p>
          </Reveal>
          <Reveal>
            <h2
              style={{
                margin: 0,
                fontFamily: "Satoshi, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(28px, 3vw, 40px)",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                color: "#eef0f6",
              }}
            >
              Propose. Review. Approve.
            </h2>
          </Reveal>
          <Reveal>
            <p
              style={{
                margin: "14px 0 0",
                fontFamily: 'var(--font-inter), "Inter", sans-serif',
                fontSize: 15,
                fontWeight: 400,
                color: "#8892a4",
                lineHeight: 1.65,
              }}
            >
              Every modification goes through a structured workflow. Stakeholders
              document their reasoning. Engineers inspect the diff. Nobody bypasses
              the gate.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <div className="cr-workflow">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.num} className="cr-workflow-step">
                <div className="cr-workflow-badge-col">
                  <div
                    className="cr-workflow-badge"
                    style={{
                      background: step.badgeBg,
                      border: `1px solid ${step.badgeBorder}`,
                      color: step.badgeColor,
                    }}
                  >
                    {step.num}
                  </div>
                  <div className="cr-workflow-connector" aria-hidden />
                </div>
                <div className="cr-workflow-content">
                  <h3
                    style={{
                      margin: "2px 0 8px",
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
                      margin: 0,
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
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
