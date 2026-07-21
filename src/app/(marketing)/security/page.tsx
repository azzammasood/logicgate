import type { Metadata } from "next";
import { Reveal } from "@/components/marketing/Reveal";
import {
  AuditLogIcon,
  LockIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SnapshotIcon,
  SsoIcon,
} from "@/components/marketing/security/SecurityIcons";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Enterprise-grade security for data definitions — row-level isolation, RBAC, immutable audit logs, and SSO.",
};

const SECURITY_FEATURES = [
  {
    Icon: ShieldIcon,
    title: "Row-level isolation",
    body: "Workspace data is isolated at the database level. No tenant can ever access another tenant's definitions or history.",
  },
  {
    Icon: LockIcon,
    title: "Role-based access",
    body: "Granular roles — Admin, Engineer, Stakeholder, Viewer — control who can create, edit, approve, or read each definition.",
  },
  {
    Icon: AuditLogIcon,
    title: "Immutable audit log",
    body: "Every action — create, edit, approve, restore — is permanently logged. No entry can be modified or erased after the fact.",
  },
  {
    Icon: SnapshotIcon,
    title: "Snapshot versioning",
    body: "Each version stores a full immutable snapshot, not a diff. Any historical state can be reconstructed exactly as it existed.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "Approval gates",
    body: "Definitions cannot be published without a named approver signing off. Enforced at the API level, not just in the UI.",
  },
  {
    Icon: SsoIcon,
    title: "SSO & SAML",
    body: "Enterprise plans include single sign-on via SAML 2.0. Connect your identity provider and manage access centrally.",
  },
] as const;

const DATA_HANDLING_ITEMS = [
  "Definitions stored encrypted at rest",
  "All API traffic over TLS 1.3",
  "GDPR-compliant data handling",
  "Workspace data deletion on request",
  "No third-party analytics on definition content",
  "SOC 2 Type II audit in progress",
] as const;

export default function SecurityPage() {
  return (
    <div className="marketing-page">
      <Reveal>
        <p className="marketing-eyebrow">SECURITY</p>
      </Reveal>
      <Reveal>
        <h1 className="marketing-page-h1">Enterprise-grade from day one</h1>
      </Reveal>
      <Reveal>
        <p className="marketing-subtitle" style={{ maxWidth: 520 }}>
          Your data definitions contain sensitive business logic. We treat them
          accordingly.
        </p>
      </Reveal>

      <div className="features-grid">
        {SECURITY_FEATURES.map((feature, i) => (
          <Reveal key={feature.title} className="feature-card">
            <div className="feature-icon-wrap">
              <feature.Icon />
            </div>
            <h3
              style={{
                margin: "0 0 10px",
                fontFamily: 'var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace',
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
            <p className="marketing-eyebrow">DATA HANDLING</p>
          </Reveal>
          <Reveal>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace',
                fontWeight: 800,
                fontSize: "clamp(28px, 3vw, 40px)",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                color: "#eef0f6",
              }}
            >
              Your logic stays yours.
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
              LogicGate stores definitions, conditions, and version snapshots. We
              do not store raw data, pipeline credentials, or production query
              results.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <ul className="security-checklist">
            {DATA_HANDLING_ITEMS.map((item) => (
              <li key={item} className="security-checklist-item">
                <span className="security-checkmark" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
