import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import "./globals-marketing.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const FONTSHARE_SATOSHI =
  "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap";

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
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="stylesheet" href={FONTSHARE_SATOSHI} />
      <div
        className={`marketing-root ${inter.variable} ${jetbrainsMono.variable} ${inter.className}`}
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
