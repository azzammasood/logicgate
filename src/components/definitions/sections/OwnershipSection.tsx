"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionCard, FieldRow } from "@/components/definitions/sections/SectionShell";
import { SectionInfoTip } from "@/components/definitions/sections/SectionInfoTip";
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";

type Member = { id: string; name: string; email: string; avatarInitials?: string };
type Owner = { id: string; name: string };

type OwnershipSectionProps = {
  definitionId: string;
  owners: Owner[];
  approverId: string | null;
  members: Member[];
  onSaved?: () => void;
  defaultCollapsed?: boolean;
};

const triggerClass = "h-9 w-full bg-[var(--background,#0d0f14)]";
const contentClass =
  "z-[200] max-h-60 w-[var(--anchor-width)] border border-white/10 bg-[#161920] text-white shadow-xl";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OwnershipSection({
  definitionId,
  owners,
  approverId,
  members,
  onSaved,
  defaultCollapsed,
}: OwnershipSectionProps) {
  const qc = useQueryClient();
  const [ownerList, setOwnerList] = useState<Owner[]>(owners);
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [approver, setApprover] = useState<string>(approverId ?? "none");
  const [emailInput, setEmailInput] = useState("");

  // Keep local state in sync with the server, but never clobber an in-flight edit.
  const serverKey = owners.map((o) => o.id).join(",");
  const lastServerKey = useRef(serverKey);
  const savingRef = useRef(false);

  useEffect(() => {
    if (serverKey !== lastServerKey.current && !savingRef.current) {
      lastServerKey.current = serverKey;
      setOwnerList(owners);
      setPendingEmails([]);
    }
  }, [serverKey, owners]);

  useEffect(() => {
    setApprover(approverId ?? "none");
  }, [approverId, definitionId]);

  const save = useMutation({
    mutationFn: async (next: { ownerIds: string[]; emails: string[]; approverId: string | null }) => {
      const res = await fetch(`/api/definitions/${definitionId}/owners`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => {
      savingRef.current = true;
      actionOverlay.show("Updating ownership");
    },
    onSettled: () => {
      savingRef.current = false;
      actionOverlay.hide();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definition", definitionId] });
      setPendingEmails([]);
      setEmailInput("");
      onSaved?.();
      toast.success("Ownership updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commit = (nextOwners: Owner[], nextEmails: string[], nextApprover: string) => {
    save.mutate({
      ownerIds: nextOwners.map((o) => o.id),
      emails: nextEmails,
      approverId: nextApprover === "none" ? null : nextApprover,
    });
  };

  const addMember = (id: string) => {
    const m = members.find((x) => x.id === id);
    if (!m || ownerList.some((o) => o.id === id)) return;
    const next = [...ownerList, { id: m.id, name: m.name }];
    setOwnerList(next);
    commit(next, pendingEmails, approver);
  };

  const removeOwner = (id: string) => {
    const next = ownerList.filter((o) => o.id !== id);
    if (next.length === 0 && pendingEmails.length === 0) {
      toast.error("Keep at least one owner");
      return;
    }
    setOwnerList(next);
    commit(next, pendingEmails, approver);
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!emailRe.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    if (pendingEmails.includes(email)) return;
    const next = [...pendingEmails, email];
    setPendingEmails(next);
    commit(ownerList, next, approver);
  };

  const removeEmail = (email: string) => {
    const next = pendingEmails.filter((e) => e !== email);
    setPendingEmails(next);
    commit(ownerList, next, approver);
  };

  const available = members.filter((m) => !ownerList.some((o) => o.id === m.id));
  const approverName =
    approver === "none" ? "None" : members.find((m) => m.id === approver)?.name ?? "Selected member";

  return (
    <SectionCard
      iconClassName="bg-[var(--accent-dim)]"
      title="Owners & Accountability"
      defaultCollapsed={defaultCollapsed}
      titleInfo={
        <SectionInfoTip
          description="Who owns and approves this definition. Owners are accountable for its correctness; the approver reviews change requests before they publish. The first owner (★) is primary."
          example="Owners: Ayesha R. (primary), Dawood L. Approver: Dawood L."
        />
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--fg-muted)]">Owners</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ownerList.map((o, i) => (
              <span
                key={o.id}
                className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-[var(--fg)]"
              >
                {i === 0 && (
                  <span className="text-[9px] text-[var(--fg-muted)]" title="Primary owner">
                    ★
                  </span>
                )}
                {o.name || "Member"}
                <button
                  type="button"
                  onClick={() => removeOwner(o.id)}
                  aria-label={`Remove owner ${o.name || "member"}`}
                  className="text-[var(--fg-muted)] hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {pendingEmails.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-[var(--fg)]"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="text-[var(--fg-muted)] hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {ownerList.length === 0 && pendingEmails.length === 0 && (
              <span className="text-xs text-[var(--fg-muted)]">
                No owners yet — add one so there&apos;s a clear person accountable for
                this definition.
              </span>
            )}
          </div>
          <p className="mt-1 text-[10px] text-[var(--fg-muted)]/60">★ primary owner</p>
        </div>

        {available.length > 0 && (
          <FieldRow label="Add member">
            <Select value="" onValueChange={(v) => v && addMember(v)}>
              <SelectTrigger className={triggerClass}>
                <SelectValue placeholder="Select a team member">Select a team member</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentClass}>
                {available.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        )}

        <FieldRow label="Add by email">
          <div className="flex items-center gap-2">
            <Input
              placeholder="name@company.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              className="h-9 flex-1 bg-[var(--background,#0d0f14)]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-white/10"
              onClick={addEmail}
              disabled={save.isPending}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </FieldRow>

        <FieldRow label="Approver">
          <Select
            value={approver}
            onValueChange={(v) => {
              if (!v) return;
              setApprover(v);
              commit(ownerList, pendingEmails, v);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Optional">{approverName}</SelectValue>
            </SelectTrigger>
            <SelectContent className={contentClass}>
              <SelectItem value="none">None</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
    </SectionCard>
  );
}
