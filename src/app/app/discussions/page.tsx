import { Topbar } from "@/components/layout/Topbar";
import { EmptyState } from "@/components/EmptyState";

export default function DiscussionsPage() {
  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Discussions" />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <EmptyState variant="no-comments" />
          <p className="mt-4 text-sm text-white/40">
            Workspace-wide discussions are coming soon. Use Discuss on a definition for now.
          </p>
        </div>
      </div>
    </div>
  );
}
