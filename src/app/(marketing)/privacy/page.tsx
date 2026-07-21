import type { Metadata } from "next";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "LogicGate privacy policy.",
};

export default function PrivacyPage() {
  return (
    <article className="marketing-legal-page">
      <Reveal>
        <p className="marketing-eyebrow">LEGAL</p>
      </Reveal>
      <Reveal>
        <h1>Privacy Policy</h1>
      </Reveal>
      <Reveal>
        <p>Last updated: June 2026</p>
        <p>
          LogicGate (&quot;we&quot;, &quot;us&quot;) respects your privacy. This
          policy explains what we collect on the marketing site and how we use it.
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>Waitlist signups.</strong> If
          you join the waitlist, we store your email address to notify you about
          product updates and early access. We do not sell your email to third
          parties.
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>Analytics.</strong> We may use
          privacy-friendly analytics to understand how visitors use the site. No
          personal data is sold for advertising.
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>Contact.</strong> Questions
          about privacy? Email{" "}
          <a href="mailto:ahmaduzzammasood@gmail.com" className="marketing-footer-link">
            ahmaduzzammasood@gmail.com
          </a>
          .
        </p>
      </Reveal>
    </article>
  );
}
