"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  definitionId: string | null;
  changeRequestId: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsButton({ collapsed }: { collapsed?: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      return json.data as { notifications: NotificationRow[]; unreadCount: number };
    },
    refetchInterval: 30_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const active = notifications.find((n) => n.id === activeId);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const review = useMutation({
    mutationFn: async ({
      changeRequestId,
      status,
      note,
    }: {
      changeRequestId: string;
      status: "APPROVED" | "REJECTED";
      note?: string;
    }) => {
      const res = await fetch(`/api/change-requests/${changeRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: note }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: (vars) =>
      actionOverlay.show(vars.status === "APPROVED" ? "Approving change" : "Rejecting change"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: (_, vars) => {
      toast.success(vars.status === "APPROVED" ? "Change approved" : "Change rejected");
      setReviewNote("");
      setActiveId(null);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["change-requests"] });
      qc.invalidateQueries({ queryKey: ["definitions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNotification(n: NotificationRow) {
    setActiveId(n.id);
    setReviewNote("");
    if (!n.readAt) markRead.mutate(n.id);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--fg-muted)] outline-none transition-colors hover:bg-white/5 hover:text-[var(--fg)]",
          collapsed && "mx-auto"
        )}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-[#0a0c10]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        className="z-[250] w-96 border-[var(--border-color)] bg-[var(--surface,#161920)] p-0"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--fg)]">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-[11px] text-[var(--accent)] hover:underline"
              onClick={async (e) => {
                e.preventDefault();
                await fetch("/api/notifications", { method: "PATCH" });
                qc.invalidateQueries({ queryKey: ["notifications"] });
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--fg-muted)]">
              No notifications yet.
            </p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className={cn(
                "w-full border-b border-[var(--border-color)] px-4 py-3 text-left transition-colors hover:bg-white/5",
                !n.readAt && "bg-[var(--accent)]/5",
                activeId === n.id && "bg-white/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[var(--fg)]">{n.title}</p>
                {!n.readAt && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--fg-muted)]">{n.body}</p>
              <p className="mt-1 text-[10px] text-[var(--fg-muted)]">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </button>
          ))}
        </div>

        {active && (
          <div className="border-t border-[var(--border-color)] p-4">
            <p className="text-xs font-medium text-[var(--fg)]">{active.title}</p>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">{active.body}</p>

            {active.changeRequestId && active.type === "APPROVAL_REQUEST" && (
              <Link
                href={`/app/changes?view=assigned`}
                className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
                onClick={() => setOpen(false)}
              >
                View in Reviews →
              </Link>
            )}
            {active.definitionId && (
              <Link
                href={`/app/definitions/${active.definitionId}`}
                className="mt-2 ml-3 inline-block text-xs text-[var(--accent)] hover:underline"
                onClick={() => setOpen(false)}
              >
                Open definition →
              </Link>
            )}

            {active.changeRequestId && active.type === "APPROVAL_REQUEST" && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Review comment (optional)"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="min-h-[60px] bg-[var(--background,#0d0f14)] text-xs"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[var(--accent)] text-black hover:opacity-90"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({
                        changeRequestId: active.changeRequestId!,
                        status: "APPROVED",
                        note: reviewNote.trim() || undefined,
                      })
                    }
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-[var(--border-color)]"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({
                        changeRequestId: active.changeRequestId!,
                        status: "REJECTED",
                        note: reviewNote.trim() || undefined,
                      })
                    }
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Deny
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
