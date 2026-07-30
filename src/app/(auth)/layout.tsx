// Auth pages share the landing page's terminal aesthetic (JetBrains Mono),
// independent of the in-app font the user can change later. The font variable
// itself is declared in the root layout so portalled UI (dropdowns) can use it.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-auth-mono), "JetBrains Mono", ui-monospace, monospace',
      }}
    >
      {children}
    </div>
  );
}
