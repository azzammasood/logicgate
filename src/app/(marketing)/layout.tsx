import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import "./globals-marketing.css";

// Terminal-style typeface used across the whole landing page — body, headings,
// and code all share JetBrains Mono for a cohesive monospace/terminal look.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LogicGate — Data definition management",
    template: "%s — LogicGate",
  },
  description:
    "Visually define data metrics and business rules with version control, approvals, and auto-compiled pseudocode",
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ScrollReveal>
      <div
        className={`marketing-root ${jetbrainsMono.variable} ${jetbrainsMono.className}`}
      >
        <div className="grid-overlay" aria-hidden="true" />
        <div className="marketing-shell">
          <Navbar />
          <main className="marketing-main">{children}</main>
          <Footer />
        </div>
      </div>
    </ScrollReveal>
  );
}
