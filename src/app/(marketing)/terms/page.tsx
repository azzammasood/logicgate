import type { Metadata } from "next";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Terms",
  description: "LogicGate terms of use.",
};

export default function TermsPage() {
  return (
    <article className="marketing-legal-page">
      <Reveal>
        <p className="marketing-eyebrow">LEGAL</p>
      </Reveal>
      <Reveal>
        <h1>Terms of Use</h1>
      </Reveal>
      <Reveal>
        <p>Last updated: June 2026</p>
        <p>
          By using the LogicGate marketing website, you agree to these terms. The
          site is provided for informational purposes while the product is in
          development.
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>No warranty.</strong> Content,
          demos, and compiled code examples are provided &quot;as is&quot; without
          warranty. Do not rely on them for production decisions without independent
          verification.
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>Acceptable use.</strong> Do not
          misuse the site, attempt unauthorized access, or submit abusive content
          through contact or waitlist forms.
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>Changes.</strong> We may update
          these terms as the product evolves. Continued use of the site constitutes
          acceptance of the updated terms.
        </p>
        <p>
          Questions? Contact{" "}
          <a href="mailto:ahmaduzzammasood@gmail.com" className="marketing-footer-link">
            ahmaduzzammasood@gmail.com
          </a>
          .
        </p>
      </Reveal>
    </article>
  );
}
