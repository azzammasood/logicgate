"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/stores/workspace";

function formatParticipantList(names: string[]) {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return "team members";
  if (unique.length === 1) return unique[0]!;
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

type DiscussionThread = {
  definitionId: string;
  definitionName: string;
  messageCount: number;
  participants: string[];
};

export default function DiscussionsPage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["discussions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/discussions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return (json.data ?? []) as DiscussionThread[];
    },
    enabled: !!workspaceId,
  });

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Discussions" />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg border border-white/10 bg-[#161920] p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <EmptyState variant="no-comments" />
            <p className="mt-4 max-w-md text-center text-sm text-white/40">
              Active discussions appear here when definitions have comments. Open a definition and
              use the Discuss tab to start one.
            </p>
          </div>
        )}
        <ul className="lg-stagger space-y-3">
          {threads.map((t) => (
            <li key={t.definitionId}>
              <button
                type="button"
                onClick={() =>
                  router.push(`/app/definitions/${t.definitionId}?tab=discuss`)
                }
                className="group flex w-full items-start gap-4 rounded-lg border border-white/10 bg-[#161920] p-4 text-left transition-colors hover:border-[#4ade80]/30 hover:bg-[#1a1e29]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4ade80]/10 transition-transform duration-150 group-hover:scale-110">
                  <MessageSquare className="h-5 w-5 text-[#4ade80]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-white/90">
                    <span className="font-semibold text-white">{t.definitionName}</span> is being
                    discussed by {formatParticipantList(t.participants)}.
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {t.messageCount} message{t.messageCount === 1 ? "" : "s"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
