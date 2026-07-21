import type { Metadata } from "next";
import { DM_Mono, JetBrains_Mono } from "next/font/google";
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

// Display font for the logo, page titles and headings. JetBrains Mono renders
// cleanly (Syne's descenders — e.g. lowercase "g" — were being clipped). Kept
// on the --font-syne variable so all existing heading usages pick it up.
const syne = JetBrains_Mono({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
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

