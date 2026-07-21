"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  CheckCircle2,
  GitPullRequest,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";

type DefinitionRow = {
  id: string;
  name: string;
  type: "METRIC" | "RULE" | "FILTER" | "FLAG" | string;
  status: string;
  updatedAt: string;
};

const TYPE_META: Record<string, { label: string; bar: string; dot: string }> = {
  METRIC: { label: "Metrics", bar: "bg-blue-500", dot: "bg-blue-400" },
  RULE: { label: "Rules", bar: "bg-purple-500", dot: "bg-purple-400" },
  FILTER: { label: "Filters", bar: "bg-amber-500", dot: "bg-amber-400" },
  FLAG: { label: "Flags", bar: "bg-red-500", dot: "bg-red-400" },
};

const STATUS_META: Record<string, { label: string; color: string; ring: string }> = {
  PUBLISHED: { label: "Published", color: "#4ade80", ring: "text-[#4ade80]" },
  PENDING_REVIEW: { label: "In review", color: "#fbbf24", ring: "text-amber-400" },
  DRAFT: { label: "Draft", color: "#8b93a1", ring: "text-white/50" },
  DEPRECATED: { label: "Deprecated", color: "#f87171", ring: "text-red-400" },
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Animates a number from 0 → target with an ease-out curve. */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Runs once after mount (next frame) — used to trigger CSS entrance transitions. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  href,
  loading,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  accent: string;
  href?: string;
  loading?: boolean;
}) {
  const shown = useCountUp(value);
  const body = (
    <div className="hover-glow group relative overflow-hidden rounded-xl border border-white/10 bg-[var(--surface,#161920)] p-4">
      <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-current opacity-[0.04] blur-xl transition-opacity group-hover:opacity-[0.08]" />
      <div className="flex items-center justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accent)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {href && (
          <ArrowRight className="h-4 w-4 text-white/20 transition-colors duration-150 group-hover:text-white/50" />
        )}
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <p className="font-[family-name:var(--app-font)] text-2xl font-bold leading-none text-white tabular-nums">
            {shown}
          </p>
        )}
        <p className="mt-1.5 text-xs text-white/45">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Dependency-free SVG donut whose segments bloom in on mount. */
function StatusDonut({
  segments,
  total,
  animate,
}: {
  segments: { key: string; count: number }[];
  total: number;
  animate: boolean;
}) {
  const R = 15.915; // circumference ≈ 100
  const shownTotal = useCountUp(total);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredSeg = hovered ? segments.find((s) => s.key === hovered) : null;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full">
          <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          {total > 0 &&
            segments.map((s, i) => {
              const pct = (s.count / total) * 100;
              const offset = acc;
              acc += pct;
              // While a legend row is hovered, keep that segment bright and
              // "filter" the rest of the donut by fading them back.
              const dimmed = hovered !== null && hovered !== s.key;
              const active = hovered === s.key;
              return (
                <circle
                  key={s.key}
                  cx="18"
                  cy="18"
                  r={R}
                  fill="none"
                  stroke={STATUS_META[s.key]?.color ?? "#8b93a1"}
                  strokeWidth={active ? 4.5 : 3.5}
                  strokeDasharray={animate ? `${pct} ${100 - pct}` : "0 100"}
                  strokeDashoffset={25 - offset}
                  strokeLinecap="butt"
                  style={{
                    opacity: dimmed ? 0.15 : 1,
                    transition:
                      "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease, stroke-width 0.25s ease",
                    transitionDelay: animate ? `${i * 0.12}s` : "0s",
                  }}
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--app-font)] text-xl font-bold leading-none text-white tabular-nums transition-colors">
            {hoveredSeg ? hoveredSeg.count : shownTotal}
          </span>
          <span className="text-[10px] text-white/40">
            {hoveredSeg ? (STATUS_META[hovered!]?.label ?? "") : "total"}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-1">
        {segments.map((s) => (
          <button
            key={s.key}
            type="button"
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered((h) => (h === s.key ? null : h))}
            onFocus={() => setHovered(s.key)}
            onBlur={() => setHovered((h) => (h === s.key ? null : h))}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition-all duration-200",
              "hover:bg-white/[0.06] hover:pl-3",
              hovered !== null && hovered !== s.key && "opacity-40"
            )}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{
                background: STATUS_META[s.key]?.color ?? "#8b93a1",
                transform: hovered === s.key ? "scale(1.3)" : undefined,
              }}
            />
            <span
              className={cn(
                "transition-colors duration-200",
                hovered === s.key ? "text-white" : "text-white/70"
              )}
            >
              {STATUS_META[s.key]?.label ?? s.key}
            </span>
            <span className="ml-auto tabular-nums text-white/40">{s.count}</span>
          </button>
        ))}
        {total === 0 && <p className="px-2 text-xs text-white/35">No definitions yet.</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const mounted = useMounted();

  const { data: authMe } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      return json.data as { user: { id: string; name: string } } | null;
    },
    staleTime: 60_000,
  });
  const userId = authMe?.user?.id;
  const firstName = authMe?.user?.name?.split(/\s+/)[0];

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return (json.data ?? []) as DefinitionRow[];
    },
    enabled: !!workspaceId,
  });

  const { data: pendingAll = [] } = useQuery({
    queryKey: ["change-requests", workspaceId, "PENDING", "all"],
    queryFn: async () => {
      const res = await fetch(`/api/change-requests?workspaceId=${workspaceId}&status=PENDING`);
      const json = await res.json();
      return (json.data ?? []) as { id: string; definition: { approverId?: string | null } }[];
    },
    enabled: !!workspaceId,
  });

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const d of definitions) {
      byType[d.type] = (byType[d.type] ?? 0) + 1;
      byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    }
    const mine = pendingAll.filter((c) => c.definition?.approverId === userId).length;
    return {
      total: definitions.length,
      published: byStatus.PUBLISHED ?? 0,
      pending: pendingAll.length,
      mine,
      byType,
      byStatus,
    };
  }, [definitions, pendingAll, userId]);

  const typeOrder = ["METRIC", "RULE", "FILTER", "FLAG"];
  const statusOrder = ["PUBLISHED", "PENDING_REVIEW", "DRAFT", "DEPRECATED"];
  const recent = useMemo(() => definitions.slice(0, 6), [definitions]);
  const maxType = Math.max(1, ...typeOrder.map((t) => stats.byType[t] ?? 0));
  const animateCharts = mounted && !isLoading;
  const publishedPct = stats.total ? Math.round((stats.published / stats.total) * 100) : 0;
  const shownPublishedPct = useCountUp(animateCharts ? publishedPct : 0);

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Overview">
        <Link
          href="/app/definitions"
          className="hover-glow inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 text-sm font-medium text-black"
        >
          <Plus className="h-4 w-4" />
          New definition
        </Link>
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="lg-fade-up mx-auto max-w-5xl space-y-6">
          {!isLoading && stats.total === 0 && <OnboardingBanner />}
          {/* Hero band */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--accent)]/[0.07] via-[var(--surface,#161920)] to-[var(--surface,#161920)] p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--app-font)] text-xl font-bold text-white">
                  {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Here&rsquo;s what&rsquo;s happening across your definitions.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
                <span className="tabular-nums text-white/80">{shownPublishedPct}%</span>
                published
              </div>
            </div>
            {/* Published ratio bar */}
            <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#86efac] transition-[width] duration-1000 ease-out"
                style={{ width: animateCharts ? `${publishedPct}%` : "0%" }}
              />
            </div>
          </div>

          {/* Stat cards */}
          <div className="lg-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Total definitions"
              value={stats.total}
              accent="bg-blue-500/15 text-blue-400"
              href="/app/definitions"
              loading={isLoading}
            />
            <StatCard
              icon={CheckCircle2}
              label="Published"
              value={stats.published}
              accent="bg-[var(--accent)]/15 text-[var(--accent)]"
              loading={isLoading}
            />
            <StatCard
              icon={GitPullRequest}
              label="Pending reviews"
              value={stats.pending}
              accent="bg-amber-500/15 text-amber-400"
              href="/app/changes"
            />
            <StatCard
              icon={Clock}
              label="Awaiting your review"
              value={stats.mine}
              accent="bg-purple-500/15 text-purple-400"
              href="/app/changes?view=assigned"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[var(--surface,#161920)] p-5 transition-colors duration-200 hover:border-white/20">
              <h3 className="text-sm font-medium text-white/80">Definitions by type</h3>
              <div className="mt-4 space-y-1">
                {typeOrder.map((t, i) => {
                  const count = stats.byType[t] ?? 0;
                  const meta = TYPE_META[t]!;
                  return (
                    <div
                      key={t}
                      className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="flex w-16 items-center gap-1.5 text-xs text-white/60 transition-colors group-hover:text-white/90">
                        <span
                          className={cn("h-2 w-2 rounded-full transition-transform duration-150 group-hover:scale-125", meta.dot)}
                        />
                        {meta.label}
                      </div>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={cn("h-full rounded-full group-hover:brightness-125", meta.bar)}
                          style={{
                            width: animateCharts ? `${(count / maxType) * 100}%` : "0%",
                            transition:
                              "width 0.9s cubic-bezier(0.22,1,0.36,1), filter 0.2s ease",
                            transitionDelay: `${i * 0.08}s, 0s`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs tabular-nums text-white/50 transition-colors group-hover:text-white">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[var(--surface,#161920)] p-5">
              <h3 className="mb-4 text-sm font-medium text-white/80">Status breakdown</h3>
              <StatusDonut
                total={stats.total}
                animate={animateCharts}
                segments={statusOrder
                  .map((k) => ({ key: k, count: stats.byStatus[k] ?? 0 }))
                  .filter((s) => s.count > 0)}
              />
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-white/10 bg-[var(--surface,#161920)]">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <h3 className="text-sm font-medium text-white/80">Recently updated</h3>
              <Link href="/app/definitions" className="text-xs text-[var(--accent)] hover:underline">
                View all
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="p-6 text-center text-sm text-white/40">
                No definitions yet — create one to get started.
              </p>
            ) : (
              <ul className="lg-stagger divide-y divide-white/5">
                {recent.map((d) => {
                  const tmeta = TYPE_META[d.type];
                  const smeta = STATUS_META[d.status];
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/app/definitions/${d.id}`}
                        className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                      >
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", tmeta?.dot ?? "bg-white/40")} />
                        <span className="min-w-0 flex-1 truncate text-sm text-white/85 transition-colors group-hover:text-white">
                          {d.name}
                        </span>
                        <span className={cn("hidden text-[11px] sm:inline", smeta?.ring ?? "text-white/40")}>
                          {smeta?.label ?? d.status}
                        </span>
                        <span className="w-24 text-right text-[11px] text-white/30">
                          {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/0 transition-colors group-hover:text-white/40" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** First-run guidance shown only while the workspace has no definitions. */
function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDismissed(localStorage.getItem("lg-onboarding-dismissed") === "1");
  }, []);
  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem("lg-onboarding-dismissed", "1");
    setDismissed(true);
  };

  const steps = [
    { n: 1, title: "Define", desc: "Build a metric visually — no SQL required." },
    { n: 2, title: "Review", desc: "Send it to a teammate to approve." },
    { n: 3, title: "Compile", desc: "Copy the generated SQL / Python / dbt." },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.05] p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss getting-started guide"
        className="absolute right-3 top-3 rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <h3 className="font-[family-name:var(--app-font)] text-lg font-bold text-white">
        Welcome to LogicGate
      </h3>
      <p className="mt-1 text-sm text-white/55">
        Turn business metrics into versioned, compiled code in three steps.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-xl border border-white/10 bg-[var(--surface,#161920)]/60 p-3"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-semibold text-[var(--accent)]">
              {s.n}
            </span>
            <p className="mt-2 text-sm font-medium text-white">{s.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/50">{s.desc}</p>
          </div>
        ))}
      </div>
      <Link
        href="/app/definitions"
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-black hover:opacity-90"
      >
        Create your first definition <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
