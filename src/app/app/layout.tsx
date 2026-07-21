import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";
import { AppShell } from "@/components/layout/AppShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <AppShell>
          <PageTransition>{children}</PageTransition>
          <CommandPalette />
        </AppShell>
      </WorkspaceProvider>
    </ErrorBoundary>
  );
}
