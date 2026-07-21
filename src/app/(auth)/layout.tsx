import { JetBrains_Mono } from "next/font/google";

// Auth pages share the landing page's terminal aesthetic (JetBrains Mono),
// independent of the in-app font the user can change later.
const authMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-auth-mono",
  display: "swap",
});

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={authMono.variable}
      style={{
        fontFamily: 'var(--font-auth-mono), "JetBrains Mono", ui-monospace, monospace',
      }}
    >
      {children}
    </div>
  );
}
