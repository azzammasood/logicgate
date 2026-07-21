"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, X } from "lucide-react";
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
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function toggleOpen() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const width = 620;
      const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12));
      setPos({ left, bottom: window.innerHeight - r.top + 8 });
    }
    if (open) setActiveId(null);
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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

  const isApproval = !!(active && active.changeRequestId && active.type === "APPROVAL_REQUEST");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--fg-muted)] outline-none transition-colors hover:bg-white/5 hover:text-[var(--fg)]",
          collapsed && "mx-auto",
          open && "bg-white/5 text-[var(--fg)]"
        )}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-[#0a0c10]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && pos && (
        <div className="fixed inset-0 z-[250]" onClick={() => setOpen(false)} role="presentation">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ left: pos.left, bottom: pos.bottom }}
            className="lg-pop fixed flex h-[min(70vh,460px)] w-[620px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[var(--surface,#161920)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--fg)]">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="text-[11px] text-[var(--accent)] hover:underline"
                  onClick={async () => {
                    await fetch("/api/notifications", { method: "PATCH" });
                    qc.invalidateQueries({ queryKey: ["notifications"] });
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex min-h-0 flex-1">
              {/* List */}
              <div className="w-60 shrink-0 overflow-y-auto border-r border-[var(--border-color)]">
                {notifications.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-[var(--fg-muted)]">
                    No notifications yet.
                  </p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className={cn(
                      "w-full border-b border-[var(--border-color)] px-3.5 py-3 text-left transition-colors hover:bg-white/5",
                      activeId === n.id ? "bg-[var(--accent)]/10" : !n.readAt && "bg-[var(--accent)]/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-[var(--fg)]">{n.title}</p>
                      {!n.readAt && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--fg-muted)]">{n.body}</p>
                    <p className="mt-1 text-[10px] text-[var(--fg-muted)]">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>

              {/* Detail */}
              <div className="min-w-0 flex-1 overflow-y-auto p-4">
                {!active ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <Bell className="h-6 w-6 text-white/15" />
                    <p className="text-xs text-[var(--fg-muted)]">
                      Select a notification to see details.
                    </p>
                  </div>
                ) : (
                  <div className="lg-fade-in">
                    <p className="text-sm font-semibold text-[var(--fg)]">{active.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--fg-muted)]">
                      {formatDistanceToNow(new Date(active.createdAt), { addSuffix: true })}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg)]/85">
                      {active.body}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4">
                      {isApproval && (
                        <Link
                          href="/app/changes?view=assigned"
                          className="text-xs text-[var(--accent)] hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          View in Reviews →
                        </Link>
                      )}
                      {active.definitionId && (
                        <Link
                          href={`/app/definitions/${active.definitionId}`}
                          className="text-xs text-[var(--accent)] hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          Open definition →
                        </Link>
                      )}
                    </div>

                    {isApproval && (
                      <div className="mt-4 border-t border-[var(--border-color)] pt-4">
                        <label className="text-xs font-medium text-[var(--fg)]">Review</label>
                        <Textarea
                          placeholder="Review comment (optional)"
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          className="mt-2 min-h-[72px] bg-[var(--background,#0d0f14)] text-xs"
                          rows={3}
                        />
                        <div className="mt-2 flex gap-2">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
