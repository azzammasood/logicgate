"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageLoader } from "@/components/layout/PageLoader";
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";

type DiscussPanelProps = {
  definitionId: string;
  currentUserId?: string;
};

export function DiscussPanel({ definitionId, currentUserId }: DiscussPanelProps) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", definitionId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/comments`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!definitionId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/definitions/${definitionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => actionOverlay.show("Posting comment"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", definitionId] });
      toast.success("Comment added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", definitionId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col p-6">
      <PageLoader active={isLoading} message="Loading discussion…" />
      <div className="flex-1 space-y-4 overflow-y-auto">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="lg-skeleton h-16 rounded-lg" />
          ))}
        {comments.map(
          (c: {
            id: string;
            body: string;
            createdAt: string;
            authorId: string;
            author: { name: string; avatarInitials: string };
          }) => (
            <div
              key={c.id}
              className="flex gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface,#161920)] p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="flex items-center justify-center bg-[var(--accent)]/15 text-[10px] font-semibold leading-none text-[var(--accent)]">
                  {c.author?.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--fg)]">{c.author?.name}</p>
                  <span className="text-[10px] text-[var(--fg-muted)]">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--fg)]/80">{c.body}</p>
              </div>
              {currentUserId === c.authorId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => deleteMutation.mutate(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              )}
            </div>
          )
        )}
        {!isLoading && comments.length === 0 && (
          <p className="text-sm text-[var(--fg-muted)]">No comments yet. Start the discussion.</p>
        )}
      </div>
      <form
        className="mt-4 border-t border-[var(--border-color)] pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          createMutation.mutate(body.trim());
        }}
      >
        <Textarea
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mb-2 bg-[var(--surface,#161920)]"
          rows={3}
        />
        <Button
          type="submit"
          disabled={!body.trim() || createMutation.isPending}
          className="bg-[var(--accent)] text-black"
        >
          Post comment
        </Button>
      </form>
    </div>
  );
}
