import type { Metadata } from "next";
import { Reveal } from "@/components/marketing/Reveal";
import {
  ClockIcon,
  DocumentIcon,
  LogicGateIcon,
  OwnershipIcon,
  PackageIcon,
  WaveformIcon,
} from "@/components/marketing/features/FeatureIcons";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Visual logic builder, auto-compiled pseudocode, version history, change requests, ownership, and pipeline export.",
};

const FEATURES = [
  {
    Icon: LogicGateIcon,
    title: "Visual Logic Builder",
    body: "Stakeholders define metrics, rules, and filters using dropdowns and condition blocks. No SQL knowledge required.",
  },
  {
    Icon: WaveformIcon,
    title: "Auto-compiled Pseudocode",
    body: "Every saved definition compiles instantly to Generic, SQL, Python, or dbt. Always in sync with the latest approved version.",
  },
  {
    Icon: ClockIcon,
    title: "Full Version History",
    body: "Every change creates an immutable snapshot. Compare any two versions side-by-side. Restore to any point in time in one click.",
  },
  {
    Icon: DocumentIcon,
    title: "Change Request Workflow",
    body: "Stakeholders propose changes with a mandatory written reason. Engineers approve or reject with a note. Nothing goes live without a paper trail.",
  },
  {
    Icon: OwnershipIcon,
    title: "Named Ownership",
    body: "Every definition has a named owner and a designated approver. Someone is always responsible — with timestamps and reasons attached.",
  },
  {
    Icon: PackageIcon,
    title: "Pipeline Export",
    body: "Bulk-export all published definitions as .sql, .py, or dbt model files. Zip download or webhook-push to your pipeline.",
  },
] as const;

const COMPILE_FORMATS = [
  {
    name: "Generic",
    desc: "Human-readable pseudocode for stakeholders, auditors, and cross-functional review.",
  },
  {
    name: "SQL",
    desc: "Valid SELECT statements ready to paste into your warehouse or orchestration tool.",
  },
  {
    name: "Python",
    desc: "Typed pandas functions with filters and aggregations mapped from the visual definition.",
  },
  {
    name: "dbt",
    desc: "Models with jinja, ref(), and tests generated from the same approved logic.",
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="marketing-page">
      <Reveal>
        <p className="marketing-eyebrow">FEATURES</p>
      </Reveal>
      <Reveal>
        <h1 className="marketing-page-h1">Everything your logic needs</h1>
      </Reveal>
      <Reveal>
        <p className="marketing-subtitle" style={{ maxWidth: 520 }}>
          One place for every metric, rule, and filter your data pipelines depend
          on.
        </p>
      </Reveal>

      <div className="features-grid">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} className="feature-card">
            <div className="feature-icon-wrap">
              <feature.Icon />
            </div>
            <h3
              style={{
                margin: "0 0 10px",
                fontFamily: "Satoshi, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#eef0f6",
              }}
            >
              {feature.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-inter), "Inter", sans-serif',
                fontSize: 14,
                fontWeight: 400,
                color: "#8892a4",
                lineHeight: 1.65,
              }}
            >
              {feature.body}
            </p>
          </Reveal>
        ))}
      </div>

      <div className="features-compile-layout">
        <div>
          <Reveal>
            <p className="marketing-eyebrow">COMPILE TARGETS</p>
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
              One definition. Four formats.
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
              LogicGate compiles the same visual definition to whichever format
              your pipeline needs. Switch formats without touching the
              definition.
            </p>
          </Reveal>
        </div>

        <div className="features-format-grid">
          {COMPILE_FORMATS.map((format, i) => (
            <Reveal
              key={format.name}
              className="features-format-card"
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontFamily: "Satoshi, sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#eef0f6",
                }}
              >
                {format.name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-inter), "Inter", sans-serif',
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#8892a4",
                  lineHeight: 1.55,
                }}
              >
                {format.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
