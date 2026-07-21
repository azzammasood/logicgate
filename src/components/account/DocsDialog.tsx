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
  GitPullRequest,
  Shield,
  Code2,
  Users,
  Rocket,
} from "lucide-react";

const P = "mt-2 text-sm leading-relaxed text-[var(--fg-muted)]";
const H4 = "mt-5 text-sm font-semibold text-[var(--fg)]";
const UL = "mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--fg-muted)]";
const STRONG = "font-medium text-[var(--fg)]";

const SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    icon: BookOpen,
    content: (
      <>
        <h3 className="text-lg font-semibold">What is LogicGate?</h3>
        <p className={P}>
          LogicGate is a single source of truth for the business logic behind your data. Instead of a
          metric like &ldquo;monthly active revenue&rdquo; living in scattered SQL files, Slack
          threads, and someone&rsquo;s head, you define it once — visually — and LogicGate keeps it
          versioned, reviewed, and compiled into runnable code for every team.
        </p>
        <p className={P}>
          It solves a specific, expensive problem: <em>definition drift</em>. When the same metric
          is re-implemented slightly differently in five places, reports disagree and no one can say
          which number is correct. LogicGate makes the definition the artifact, and the code a
          byproduct of it.
        </p>
        <h4 className={H4}>Core concepts</h4>
        <ul className={UL}>
          <li><span className={STRONG}>Definition</span> — a named metric, rule, filter, or flag (e.g. &ldquo;Active Revenue&rdquo;). This is the unit you edit and publish.</li>
          <li><span className={STRONG}>Condition</span> — a single filter row inside a definition (<code className="rounded bg-white/5 px-1">status = &quot;completed&quot;</code>). Conditions combine with AND/OR.</li>
          <li><span className={STRONG}>Version</span> — an immutable snapshot created every time you publish, with a commit-style message.</li>
          <li><span className={STRONG}>Change request</span> — a proposed edit that an approver must accept before it goes live.</li>
          <li><span className={STRONG}>Workspace / organization</span> — the container that holds definitions, members, and settings.</li>
        </ul>
        <h4 className={H4}>How the pieces fit</h4>
        <p className={P}>
          You build a definition in the visual builder → LogicGate autosaves your draft → you publish
          a version with a message → the definition compiles to Generic / SQL / Python / dbt →
          teammates review changes and discuss → everyone exports the same, agreed-upon logic.
        </p>
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
        <p className={P}>
          Open <strong className={STRONG}>Definitions</strong> from the sidebar. The screen has three
          columns: the <strong className={STRONG}>list</strong> on the left (filter by Active /
          Deprecated / All and search), the <strong className={STRONG}>builder</strong> in the
          center, and the <strong className={STRONG}>pseudocode + history</strong> panel on the
          right. Selecting a definition only swaps the center and right panels — the list keeps its
          place.
        </p>
        <h4 className={H4}>The builder, section by section</h4>
        <ul className={UL}>
          <li><span className={STRONG}>Source</span> — the table and the value/date columns the metric reads from (e.g. <code className="rounded bg-white/5 px-1">transactions</code>, <code className="rounded bg-white/5 px-1">amount_usd</code>, <code className="rounded bg-white/5 px-1">created_at</code>).</li>
          <li><span className={STRONG}>Conditions</span> — the filter rows that decide which records count. Each row is a field, an operator, and a value, joined by AND/OR.</li>
          <li><span className={STRONG}>Aggregation</span> — how rows collapse into a number: SUM, COUNT, COUNT DISTINCT, AVG…, plus the group-by period (e.g. calendar month) and optional dedupe key.</li>
          <li><span className={STRONG}>Ownership</span> — the named owner responsible for the definition and an optional approver who signs off on changes.</li>
          <li><span className={STRONG}>Documentation</span> — a plain-language explanation, saved with each published version and shown in the changelog.</li>
        </ul>
        <h4 className={H4}>Types &amp; status</h4>
        <p className={P}>
          A definition is a <span className={STRONG}>Metric</span> (a number), a{" "}
          <span className={STRONG}>Rule</span> (a policy), a <span className={STRONG}>Filter</span>{" "}
          (a reusable segment), or a <span className={STRONG}>Flag</span> (a boolean). When a
          definition is retired, mark it <span className={STRONG}>Deprecated</span> in Settings — it
          stays for history but drops out of the default Active list.
        </p>
        <h4 className={H4}>Draft vs. published</h4>
        <p className={P}>
          Your edits autosave continuously as a <em>draft</em> — nothing your teammates rely on
          changes yet. A draft only becomes the live definition when you press{" "}
          <strong className={STRONG}>Publish</strong> and write a message, exactly like a git commit.
          This is what keeps published logic stable while you experiment.
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
        <p className={P}>
          Every <strong className={STRONG}>Publish</strong> writes a new version — a complete JSON
          snapshot of the definition, all its conditions, ownership, and documentation at that
          moment. Snapshots are stored in full (not as diffs), so any past state can be reconstructed
          exactly, even if the schema later changes.
        </p>
        <h4 className={H4}>What you can do with versions</h4>
        <ul className={UL}>
          <li><span className={STRONG}>Changelog tab</span> — the list of published versions with author, timestamp, and message. Click a row to see what changed.</li>
          <li><span className={STRONG}>Compare</span> — pick any two versions and see a field-by-field and condition-by-condition diff, with removed values struck through and added values highlighted.</li>
          <li><span className={STRONG}>Restore</span> — replay an older snapshot. This doesn&rsquo;t erase history; it creates a <em>new</em> version equal to the old one, so the timeline stays intact.</li>
          <li><span className={STRONG}>History</span> — a workspace-wide feed of every publish across all definitions.</li>
        </ul>
        <p className={P}>
          Because versions are immutable and append-only, &ldquo;who changed this metric, when, and
          why&rdquo; always has a definitive answer.
        </p>
      </>
    ),
  },
  {
    id: "reviews",
    label: "Change requests",
    icon: GitPullRequest,
    content: (
      <>
        <h3 className="text-lg font-semibold">Change requests &amp; approvals</h3>
        <p className={P}>
          When a definition has a designated approver (or your workspace requires approval before
          publishing), edits don&rsquo;t go live directly — they become a{" "}
          <strong className={STRONG}>change request</strong> that must be reviewed first. This is how
          LogicGate enforces that sensitive metrics can&rsquo;t silently change.
        </p>
        <h4 className={H4}>The flow</h4>
        <ul className={UL}>
          <li><span className={STRONG}>Propose</span> — the editor makes changes and submits them with a written reason (workspaces can require a minimum length so &ldquo;fix&rdquo; isn&rsquo;t enough).</li>
          <li><span className={STRONG}>Notify</span> — the approver sees it under <strong className={STRONG}>Reviews</strong> in the sidebar, with a badge count of what&rsquo;s pending for them.</li>
          <li><span className={STRONG}>Review</span> — the approver compares the proposed snapshot against the current one, then approves or requests changes with a note.</li>
          <li><span className={STRONG}>Publish</span> — on approval the change is published as a new version, attributed to both the requester and the approver.</li>
        </ul>
        <p className={P}>
          A definition being edited shows a <span className={STRONG}>Pending change</span> banner in
          the pseudocode panel so everyone knows a review is in flight before they depend on it.
        </p>
      </>
    ),
  },
  {
    id: "roles",
    label: "Roles & permissions",
    icon: Shield,
    content: (
      <>
        <h3 className="text-lg font-semibold">Roles &amp; permissions</h3>
        <p className={P}>
          LogicGate has two independent layers of access: your <strong className={STRONG}>profile
          role</strong> (what kind of user you are) and your{" "}
          <strong className={STRONG}>workspace role</strong> (your authority inside a specific
          organization).
        </p>
        <h4 className={H4}>Profile roles</h4>
        <div className="mt-2 space-y-2 text-sm text-[var(--fg-muted)]">
          <p><span className={STRONG}>Engineer</span> — creates and edits definitions and can approve changes. The default for hands-on data builders.</p>
          <p><span className={STRONG}>Architect</span> — same capabilities as Engineer, intended for whoever owns data architecture and standards.</p>
          <p><span className={STRONG}>Analyst</span> — edits definitions they own and submits change requests for others.</p>
          <p><span className={STRONG}>Stakeholder</span> — edits owned definitions and requests reviews from approvers; typically business owners of a metric.</p>
        </div>
        <h4 className={H4}>Workspace roles</h4>
        <p className={P}>
          <span className={STRONG}>Owner</span> manages the organization, members, and settings.{" "}
          <span className={STRONG}>Editor</span> works on definitions. <span className={STRONG}>Viewer</span>{" "}
          has read-only access. Team management and destructive actions are gated on the workspace
          role, so being an Engineer in one org doesn&rsquo;t grant admin rights in another.
        </p>
      </>
    ),
  },
  {
    id: "pseudocode",
    label: "Pseudocode & export",
    icon: Code2,
    content: (
      <>
        <h3 className="text-lg font-semibold">Auto-compiled pseudocode</h3>
        <p className={P}>
          As you edit, LogicGate compiles the definition into runnable code in the right-hand panel —
          live, on every change. The definition is the source of truth; the code is generated from
          it, so the two never drift apart.
        </p>
        <h4 className={H4}>Formats</h4>
        <ul className={UL}>
          <li><span className={STRONG}>Generic</span> — human-readable pseudocode for stakeholders, auditors, and review.</li>
          <li><span className={STRONG}>SQL</span> — a valid <code className="rounded bg-white/5 px-1">SELECT</code> ready to paste into your warehouse.</li>
          <li><span className={STRONG}>Python</span> — a typed pandas function with the same filters and aggregation.</li>
          <li><span className={STRONG}>dbt</span> — a model with jinja and <code className="rounded bg-white/5 px-1">ref()</code> wired to your source table.</li>
        </ul>
        <p className={P}>
          Switching formats recompiles in place without disturbing the panel. Use{" "}
          <strong className={STRONG}>Pseudocodes</strong> in the sidebar to bulk-export many
          definitions at once as a ZIP of <code className="rounded bg-white/5 px-1">.sql</code>,{" "}
          <code className="rounded bg-white/5 px-1">.py</code>, or dbt model files for your pipeline.
        </p>
      </>
    ),
  },
  {
    id: "organizations",
    label: "Organizations & teams",
    icon: Users,
    content: (
      <>
        <h3 className="text-lg font-semibold">Organizations &amp; teams</h3>
        <p className={P}>
          A <strong className={STRONG}>workspace</strong> (organization) is where your definitions,
          members, and settings live. You can belong to several and switch between them from the rail
          on the far left — switching re-scopes the whole app to that org.
        </p>
        <h4 className={H4}>Personal vs. organization</h4>
        <p className={P}>
          You don&rsquo;t need a company to use LogicGate. Choose a{" "}
          <span className={STRONG}>personal workspace</span> to record and version your own logics
          solo, and create or join an organization later when you&rsquo;re ready to collaborate.
        </p>
        <h4 className={H4}>Joining &amp; the name lock</h4>
        <ul className={UL}>
          <li>Create a new org, or <span className={STRONG}>join an existing one</span> with an invite link during setup.</li>
          <li>Everything about an org stays editable after creation — icon, description, and workflow settings — under <strong className={STRONG}>Configuration</strong>.</li>
          <li>The one exception: once other members have joined, the <span className={STRONG}>organization name is locked</span>, so a rename can&rsquo;t confuse the rest of the team.</li>
        </ul>
        <h4 className={H4}>Workflow settings</h4>
        <p className={P}>
          Owners can require a minimum-length reason on every change and require approval before any
          publish, tightening governance as the team grows.
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
          <li>Create an organization, join one with an invite, or pick a personal workspace.</li>
          <li>Add a definition under <strong className={STRONG}>Definitions → New</strong> and give it a name and type.</li>
          <li>In the builder, set the source table, add conditions, and choose an aggregation.</li>
          <li>Assign an owner and (optionally) an approver, and write a short documentation blurb.</li>
          <li>Watch the pseudocode panel compile your logic live; switch formats to check SQL/Python/dbt.</li>
          <li>Press <strong className={STRONG}>Publish</strong> with a clear message to record your first version.</li>
          <li>Export pseudocode, or invite teammates to review and build alongside you.</li>
        </ol>
        <p className={P}>
          Tip: keep definitions small and composable. A well-named Filter reused across metrics beats
          the same conditions copy-pasted everywhere.
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
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
                  section === s.id
                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "text-[var(--fg-muted)] hover:bg-white/5"
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{active.content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
