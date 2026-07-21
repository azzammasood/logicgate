import type { Metadata } from "next";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Story",
  description:
    "Why LogicGate exists — born from real data engineering pain at Nayatel.",
};

export default function StoryPage() {
  return (
    <article className="marketing-legal-page">
      <Reveal>
        <p className="marketing-eyebrow">OUR STORY</p>
      </Reveal>
      <Reveal>
        <h1>Built from broken definitions</h1>
      </Reveal>
      <Reveal>
        <p>
          LogicGate started with a problem Ahmad Uzzam Masood kept running into as a
          data engineer at Nayatel. Business metrics and rules lived in meetings,
          spreadsheets, and side conversations — not in a system anyone could trust.
        </p>
        <p>
          Stakeholders would change logic without leaving a record. A metric defined
          one way in January would be reinterpreted by March, and when pipelines
          broke or numbers disagreed, previous agreements were conveniently forgotten.
          Engineers were left reconciling conflicting definitions instead of building.
        </p>
        <p>
          Ahmad built LogicGate to fix that loop: stakeholders define metrics
          visually, every change is versioned and approved, and engineers receive
          compiled output they can drop straight into SQL, Python, or dbt pipelines.
          One source of truth — not another document that goes stale.
        </p>
        <p>
          If your team has ever argued about what &quot;active revenue&quot; or
          &quot;churn&quot; actually means, LogicGate is for you.
        </p>
      </Reveal>
    </article>
  );
}
