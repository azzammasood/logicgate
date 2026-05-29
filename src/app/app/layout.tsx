import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <AppShell>
          {children}
          <CommandPalette />
        </AppShell>
      </WorkspaceProvider>
    </ErrorBoundary>
  );
}
