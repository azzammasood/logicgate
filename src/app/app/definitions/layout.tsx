import { DefinitionsListPanel } from "@/components/definitions/DefinitionsListPanel";
import { PseudocodeSidebar } from "@/components/definitions/PseudocodeSidebar";
import { DefinitionsTopBar } from "@/components/definitions/DefinitionsTopBar";

export default function DefinitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <DefinitionsTopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DefinitionsListPanel />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--background,#0d0f14)]">
          {children}
        </div>
        <PseudocodeSidebar />
      </div>
    </div>
  );
}
