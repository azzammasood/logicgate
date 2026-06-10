"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Layers,
  GitBranch,
  Shield,
  Code2,
  Rocket,
} from "lucide-react";

const SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    icon: BookOpen,
    content: (
      <>
        <h3 className="text-lg font-semibold">What is LogicGate?</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          LogicGate is a collaborative platform for defining, versioning, and exporting business
          metrics and data rules. Engineers and architects build definitions visually; analysts and
          stakeholders review changes; every publish creates an immutable version snapshot with a
          commit-style message.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--fg-muted)]">
          <li>Visual builder for metrics, rules, filters, and flags</li>
          <li>Git-style publish flow with version history</li>
          <li>Auto-compiled pseudocode (Generic, SQL, Python, dbt)</li>
          <li>Change requests and approver workflows</li>
        </ul>
      </>
    ),
  },
  {
    id: "definitions",
    label: "Definitions",
    icon: Layers,
    content: (
      <>
        <h3 className="text-lg font-semibold">Working with definitions</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          Open <strong>Definitions</strong> in the sidebar. Select a definition from the left
          panel to edit it in the center. The right panel shows auto-compiled pseudocode and compact
          version history.
        </p>
        <h4 className="mt-4 text-sm font-medium">Tabs</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--fg-muted)]">
          <li><strong>Builder</strong> — source, conditions, aggregation, ownership</li>
          <li><strong>Changelog</strong> — published versions; click a row to see what changed</li>
          <li><strong>Discuss</strong> — comments on the definition</li>
          <li><strong>Settings</strong> — name, group, type, deprecate</li>
        </ul>
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          Edits autosave as a draft. Use <strong>Publish</strong> in the top bar to record a version
          with a message (like a git commit).
        </p>
      </>
    ),
  },
  {
    id: "versions",
    label: "Version control",
    icon: GitBranch,
    content: (
      <>
        <h3 className="text-lg font-semibold">Version control</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          Versions are created only when you publish — not on every autosave. Each version stores a
          full JSON snapshot of the definition, conditions, and owners.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--fg-muted)]">
          <li><strong>Compare</strong> — diff any two published versions</li>
          <li><strong>Restore</strong> — replay an older snapshot (creates a new version)</li>
          <li><strong>Version History</strong> — workspace-wide feed under the sidebar</li>
        </ul>
      </>
    ),
  },
  {
    id: "roles",
    label: "Roles & permissions",
    icon: Shield,
    content: (
      <>
        <h3 className="text-lg font-semibold">User roles</h3>
        <div className="mt-3 space-y-3 text-sm text-[var(--fg-muted)]">
          <p><strong className="text-[var(--fg)]">Engineer</strong> — create and edit definitions; approve changes.</p>
          <p><strong className="text-[var(--fg)]">Architect</strong> — same as Engineer; intended for data architecture owners.</p>
          <p><strong className="text-[var(--fg)]">Analyst</strong> — edit definitions they own; submit change requests.</p>
          <p><strong className="text-[var(--fg)]">Stakeholder</strong> — edit owned definitions; request reviews from approvers.</p>
        </div>
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          Workspace roles (Owner / Editor / Viewer) control organization-level access separately
          from your profile role.
        </p>
      </>
    ),
  },
  {
    id: "pseudocode",
    label: "Pseudocode",
    icon: Code2,
    content: (
      <>
        <h3 className="text-lg font-semibold">Auto-compiled pseudocode</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          The right sidebar compiles your definition into pseudocode as you edit. Switch format tabs
          for Generic, SQL, Python, or dbt output. Use <strong>Pseudocode Export</strong> in the
          sidebar to download a ZIP of multiple definitions.
        </p>
      </>
    ),
  },
  {
    id: "getting-started",
    label: "Getting started",
    icon: Rocket,
    content: (
      <>
        <h3 className="text-lg font-semibold">Quick start</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--fg-muted)]">
          <li>Create or join a workspace (organization).</li>
          <li>Add a definition under <strong>Definitions → New</strong>.</li>
          <li>Set source table, conditions, and aggregation.</li>
          <li>Assign owners and an optional approver.</li>
          <li>Publish with a clear commit message.</li>
          <li>Export pseudocode or share with your data team.</li>
        </ol>
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          See the repository README and <code className="rounded bg-white/5 px-1">docs/</code> folder
          for setup, deployment, and QA checklists.
        </p>
      </>
    ),
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function DocsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [section, setSection] = useState<SectionId>("overview");
  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden border-[var(--border-color)] bg-[var(--surface,#161920)] p-0 text-[var(--fg)] sm:max-w-3xl">
        <DialogHeader className="border-b border-[var(--border-color)] px-5 py-4">
          <DialogTitle>LogicGate documentation</DialogTitle>
        </DialogHeader>
        <div className="flex h-[65vh] min-h-0">
          <nav className="w-48 shrink-0 space-y-1 overflow-y-auto border-r border-[var(--border-color)] p-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    section === s.id
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--fg-muted)] hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{active.content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
