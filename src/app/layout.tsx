import type { Metadata } from "next";
import { DM_Mono, Syne } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppearanceProvider } from "@/components/providers/AppearanceProvider";
import { Toaster } from "sonner";
import "./globals.css";

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  preload: false,
});

// Display font for the logo, page titles and headings — Syne, matching the
// original UI design. Descender clipping is avoided by giving titles enough
// line-height where they render (avoid leading-none on Syne text).
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "LogicGate",
  description: "Define metrics and business rules with accountability",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${dmMono.variable} ${syne.variable} min-h-screen`}>
        <QueryProvider>
          <AppearanceProvider>
            <TooltipProvider>
              {children}
              <Toaster theme="dark" position="bottom-right" richColors />
            </TooltipProvider>
          </AppearanceProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

