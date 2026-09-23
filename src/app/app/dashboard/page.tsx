"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Plus,
  Search,
  SearchX,
  ShieldCheck,
  Shuffle,
  Split,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { VersionDrawer } from "@/components/dashboard/VersionDrawer";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  DRIFT_TYPE_COLOR,
  type DriftDefinition,
  type DriftPayload,
  type DriftType,
  type DriftVersion,
} from "@/lib/drift";
import "./drift.css";

const DAY = 864e5;

type SortKey = "volatile" | "recent" | "quiet" | "az";

const TYPE_CHIPS: { key: "all" | DriftType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "metric", label: "Metrics" },
  { key: "rule", label: "Rules" },
  { key: "filter", label: "Filters" },
  { key: "flag", label: "Flags" },
];

const fmt = (dt: Date) => dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Versions that actually landed — pending change requests haven't shipped yet. */
const shippedOf = (def: DriftDefinition) => def.versions.filter((v) => v.kind !== "pending");

type Stability = { label: string; sub: string; color: string; score: number; quiet: number };

export default function DashboardPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const router = useRouter();

  const [weeks, setWeeks] = useState(12);
  const [type, setType] = useState<"all" | DriftType>("all");
  const [sort, setSort] = useState<SortKey>("volatile");
  const [query, setQuery] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [selected, setSelected] = useState<{ definitionId: string; versionKey: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["drift", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/drift?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as DriftPayload;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const all = useMemo(() => data?.definitions ?? [], [data]);
  // The axis is anchored to the server's clock (not the browser's) so lane
  // positions are the same for everyone looking at the same payload. Until it
  // arrives the card renders skeletons instead of a timeline.
  const now = data ? new Date(data.generatedAt).getTime() : 0;
  const rangeStart = now - weeks * 7 * DAY;
  const rangeLabel = weeks === 26 ? "last 6 months" : `last ${weeks} weeks`;

  const pos = (time: number) =>
    Math.max(0, Math.min(100, ((time - rangeStart) / (now - rangeStart)) * 100));
  const inRange = useCallback(
    (v: DriftVersion) => new Date(v.date).getTime() >= rangeStart,
    [rangeStart]
  );

  const stability = useCallback(
    (def: DriftDefinition): Stability => {
      const shipped = shippedOf(def);
      const inRangeCount = shipped.filter(inRange).length;
      const last = shipped[shipped.length - 1];
      const quiet = last ? Math.round((now - new Date(last.date).getTime()) / DAY) : 0;
      if (def.status === "deprecated")
        return {
          label: "retired",
          sub: "excluded from outputs",
          color: "var(--text3)",
          score: -1,
          quiet,
        };
      if (def.versions.some((v) => v.kind === "pending"))
        return {
          label: "in review",
          sub: `${inRangeCount} shipped · 1 pending`,
          color: "var(--amber)",
          score: inRangeCount + 0.5,
          quiet,
        };
      if (inRangeCount >= 4)
        return {
          label: "volatile",
          sub: `${inRangeCount} versions in range`,
          color: "var(--amber)",
          score: inRangeCount,
          quiet,
        };
      if (quiet >= 45)
        return {
          label: "settled",
          sub: `${quiet} days quiet`,
          color: "var(--accent)",
          score: inRangeCount,
          quiet,
        };
      return {
        label: "shifting",
        sub: `${inRangeCount} version${inRangeCount === 1 ? "" : "s"} · ${quiet}d quiet`,
        color: "var(--purple)",
        score: inRangeCount,
        quiet,
      };
    },
    [now, inRange]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all
      .filter((d) => showRetired || d.status !== "deprecated")
      .filter((d) => type === "all" || d.type === type)
      .filter((d) => d.name.toLowerCase().includes(q));
    const lastDate = (d: DriftDefinition) =>
      new Date(d.versions[d.versions.length - 1]?.date ?? 0).getTime();
    const sorters: Record<SortKey, (a: DriftDefinition, b: DriftDefinition) => number> = {
      volatile: (a, b) => stability(b).score - stability(a).score,
      recent: (a, b) => lastDate(b) - lastDate(a),
      quiet: (a, b) => stability(b).quiet - stability(a).quiet,
      az: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(sorters[sort]);
  }, [all, showRetired, type, query, sort, stability]);

  const active = useMemo(() => all.filter((d) => d.status !== "deprecated"), [all]);
  // The bottom cards count the same definitions the KPIs and lanes do, so
  // "who moves the logic" can't disagree with "versions shipped".
  const scoped = showRetired ? all : active;

  const kpis = useMemo(() => {
    const versions = active.flatMap((d) => d.versions.filter(inRange));
    const shipped = versions.filter((v) => v.kind !== "pending");
    const changed = active.filter((d) =>
      d.versions.some((v) => inRange(v) && v.kind !== "pending")
    ).length;
    const withReason = versions.filter((v) => v.reason.trim()).length;
    const signOffDays = (data?.signOffs ?? [])
      .filter((s) => new Date(s.date).getTime() >= rangeStart)
      .map((s) => s.days)
      .sort((a, b) => a - b);
    const mid = Math.floor(signOffDays.length / 2);
    const median = signOffDays.length
      ? signOffDays.length % 2
        ? signOffDays[mid]
        : (signOffDays[mid - 1] + signOffDays[mid]) / 2
      : null;
    return {
      shipped: shipped.length,
      pending: versions.length - shipped.length,
      changed,
      tracked: active.length,
      reasonPct: versions.length ? Math.round((withReason / versions.length) * 100) : null,
      median,
    };
  }, [active, data, rangeStart, inRange]);

  const bars = useMemo(() => {
    const counts = Array(weeks).fill(0) as number[];
    for (const def of visible) {
      if (def.status === "deprecated") continue;
      for (const v of def.versions) {
        if (v.kind === "pending" || !inRange(v)) continue;
        const i = Math.min(
          weeks - 1,
          Math.floor((new Date(v.date).getTime() - rangeStart) / (7 * DAY))
        );
        counts[i] += 1;
      }
    }
    return counts;
  }, [visible, weeks, rangeStart, inRange]);

  const peak = Math.max(0, ...bars);
  const barMax = Math.max(1, ...bars);

  const ticks = useMemo(() => {
    const step = weeks === 4 ? 7 : weeks === 12 ? 21 : 42;
    const out: Date[] = [];
    for (let t = rangeStart; t < now - step * DAY * 0.5; t += step * DAY) out.push(new Date(t));
    return out;
  }, [weeks, rangeStart, now]);

  const movers = useMemo(() => {
    const tally = new Map<string, { count: number; color: string; initials: string }>();
    for (const def of scoped) {
      for (const v of def.versions.filter(inRange)) {
        const entry = tally.get(v.author.name) ?? {
          count: 0,
          color: v.author.color,
          initials: v.author.initials,
        };
        entry.count += 1;
        tally.set(v.author.name, entry);
      }
    }
    return [...tally.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([name, meta]) => ({ name, ...meta }));
  }, [scoped, inRange]);

  const insights = useMemo(() => {
    const scored = active.map((d) => ({ def: d, s: stability(d) }));
    const top = [...scored].sort((a, b) => b.s.score - a.s.score)[0];
    const settled = scored
      .filter((o) => o.s.label === "settled")
      .sort((a, b) => b.s.quiet - a.s.quiet)[0];
    const overlap = data?.overlaps?.[0];
    const out: { key: string; color: string; icon: React.ReactNode; title: string; body: React.ReactNode }[] = [];
    if (top && top.s.score > 0) {
      out.push({
        key: "volatile",
        color: "var(--amber)",
        icon: <Shuffle className="h-[18px] w-[18px]" />,
        title: `${top.def.name} keeps moving`,
        body: `${top.def.versions.filter(inRange).length} versions in range. Worth agreeing on it with ${top.def.owner} before the next change.`,
      });
    }
    if (overlap) {
      out.push({
        key: "overlap",
        color: "var(--blue)",
        icon: <Split className="h-[18px] w-[18px]" />,
        title: `${overlap.definitions.slice(0, 2).join(" and ")} may overlap`,
        body: (
          <>
            Both use <code>{overlap.field}</code> with different values. Some rows could match
            neither.
          </>
        ),
      });
    }
    if (settled) {
      out.push({
        key: "settled",
        color: "var(--accent)",
        icon: <ShieldCheck className="h-[18px] w-[18px]" />,
        title: `${settled.def.name} is settled`,
        body: `No change in ${settled.s.quiet} days. Safe to build on.`,
      });
    }
    return out.slice(0, 3);
  }, [active, data, stability, inRange]);

  const signedOff = useMemo(() => {
    return scoped
      .flatMap((d) => d.versions.filter((v) => v.approver).map((v) => ({ def: d, v })))
      .sort((a, b) => new Date(b.v.date).getTime() - new Date(a.v.date).getTime())
      .slice(0, 4);
  }, [scoped]);

  // Remounting the lanes on a filter change replays their entrance animation,
  // so switching range or type reads as a transition. Deliberately excludes the
  // search box: re-animating on every keystroke is worse than not animating.
  const renderKey = `${weeks}-${type}-${sort}-${showRetired}`;

  const selection = useMemo(() => {
    if (!selected) return null;
    const def = all.find((d) => d.id === selected.definitionId);
    const version = def?.versions.find((v) => v.key === selected.versionKey);
    return def && version ? { definition: def, version } : null;
  }, [selected, all]);

  return (
    <div className="flex h-full flex-col">
      <Topbar title="Dashboard">
        <Link
          href="/app/definitions"
          className="hover-glow inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 text-sm font-medium text-black"
        >
          <Plus className="h-4 w-4" />
          New definition
        </Link>
      </Topbar>

      <div className="flex-1 overflow-y-auto">
        <div className="drift-page lg-fade-up content">
          {/* ---------- hero ---------- */}
          <section className="hero">
            <div>
              <div className="eyebrow">
                <span className="live" />
                Logic drift · {rangeLabel}
              </div>
              {isLoading ? (
                <Skeleton className="h-[96px] w-full max-w-[460px]" />
              ) : (
                <h2>
                  Your definitions changed{" "}
                  <em>
                    {kpis.shipped} time{kpis.shipped === 1 ? "" : "s"}
                  </em>
                  <br />
                  in the {rangeLabel}.
                </h2>
              )}
              <p>
                Each lane is a definition and each dot a version. Long quiet lanes are logic you
                can trust. Clusters of dots are where the arguments are.
              </p>
            </div>
            <div className="kpis">
              <div className="kpi">
                <b>{kpis.shipped}</b>
                <span>versions shipped</span>
                <small>{kpis.pending} awaiting sign-off</small>
              </div>
              <div className="kpi">
                <b>{kpis.changed}</b>
                <span>definitions changed</span>
                <small>of {kpis.tracked} tracked</small>
              </div>
              <div className="kpi">
                <b style={{ color: "var(--accent)" }}>
                  {kpis.reasonPct === null ? "—" : `${kpis.reasonPct}%`}
                </b>
                <span>with a written reason</span>
                <small>no silent edits</small>
              </div>
              <div className="kpi">
                <b>{kpis.median === null ? "—" : `${kpis.median.toFixed(1)}d`}</b>
                <span>median sign-off time</span>
                <small>proposal → approval</small>
              </div>
            </div>
          </section>

          {/* ---------- toolbar ---------- */}
          <div className="toolbar">
            <div className="seg" role="group" aria-label="Time range">
              {[4, 12, 26].map((w) => (
                <button
                  key={w}
                  type="button"
                  className={weeks === w ? "on" : undefined}
                  aria-pressed={weeks === w}
                  onClick={() => setWeeks(w)}
                >
                  {w === 26 ? "6m" : `${w}w`}
                </button>
              ))}
            </div>
            <div className="chips">
              {TYPE_CHIPS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`chip${type === c.key ? " on" : ""}`}
                  aria-pressed={type === c.key}
                  style={
                    c.key === "all"
                      ? undefined
                      : ({ ["--c" as string]: DRIFT_TYPE_COLOR[c.key] } as React.CSSProperties)
                  }
                  onClick={() => setType(c.key)}
                >
                  {c.key !== "all" && <i />}
                  {c.label}
                </button>
              ))}
            </div>
            <div className="tb-right">
              <button
                type="button"
                className={`toggle${showRetired ? " on" : ""}`}
                aria-pressed={showRetired}
                onClick={() => setShowRetired((v) => !v)}
              >
                <span className="sw" />
                Show retired
              </button>
              <div className="field">
                <ArrowUpDown className="h-4 w-4" />
                <label className="sr-only" htmlFor="drift-sort">
                  Sort definitions
                </label>
                <select
                  id="drift-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="volatile">Most changed</option>
                  <option value="recent">Recently changed</option>
                  <option value="quiet">Most stable</option>
                  <option value="az">A to Z</option>
                </select>
              </div>
              <div className="field">
                <Search className="h-4 w-4" />
                <label className="sr-only" htmlFor="drift-search">
                  Filter definitions
                </label>
                <input
                  id="drift-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter definitions"
                />
              </div>
            </div>
          </div>

          {/* ---------- drift card ---------- */}
          <section className="drift" aria-label="Definition drift over time">
            {!data ? (
              <div className="row activity">
                <div className="lbl">
                  <Skeleton className="h-6 w-10" />
                </div>
                <Skeleton className="mx-2 h-[62px] w-full" />
                <div />
              </div>
            ) : (
              <>
                <div className="row activity">
                  <div className="lbl">
                    <b>{peak}</b>
                    <span>changes in the busiest week</span>
                  </div>
                  <div className="bars">
                    {bars.map((c, i) => {
                      const w = 100 / weeks;
                      return (
                        <div
                          key={i}
                          className={`bar${c ? " has" : ""}${c === peak && c > 0 ? " peak" : ""}`}
                          style={{
                            left: `calc(${i * w}% + 2px)`,
                            width: `calc(${w}% - 4px)`,
                            height: `${c ? Math.max(14, (c / barMax) * 100) : 6}%`,
                          }}
                        >
                          <span className="bt">
                            {c} · wk of {fmt(new Date(rangeStart + i * 7 * DAY))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="ct" style={{ textAlign: "right", alignSelf: "center" }}>
                    per week
                  </div>
                </div>

                <div className="row axis">
                  <span className="ct">Definition</span>
                  <div className="ticks">
                    {ticks.map((t) => (
                      <span
                        key={t.getTime()}
                        className="tick"
                        style={{ left: `${pos(t.getTime())}%` }}
                      >
                        {fmt(t).toUpperCase()}
                      </span>
                    ))}
                    <span
                      className="tick now"
                      style={{ left: "100%", transform: "translate(-100%,-50%)" }}
                    >
                      TODAY
                    </span>
                  </div>
                  <span className="ct" style={{ textAlign: "right" }}>
                    Stability
                  </span>
                </div>
              </>
            )}

            <div className="lanes">
              {!data ? (
                <div className="space-y-2 p-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="empty">
                  <SearchX className="mx-auto h-7 w-7 text-[var(--text3)]" />
                  <b>{all.length ? "No definitions match" : "No definitions yet"}</b>
                  <span>
                    {all.length
                      ? "Try another type, a wider range, or clear the search."
                      : "Create your first definition and its versions will show up here."}
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className="nowline"
                    style={{ left: "calc(100% - 22px - var(--stab-w) - 8px)" }}
                  />
                  {visible.map((def, laneIndex) => {
                    const st = stability(def);
                    const laneColor = def.status === "deprecated" ? "var(--text3)" : st.color;
                    const shipped = shippedOf(def);
                    const visibleVersions = def.versions.filter(inRange);
                    const currentKey = shipped[shipped.length - 1]?.key;
                    const firstPos = visibleVersions.length
                      ? pos(new Date(visibleVersions[0].date).getTime())
                      : 0;
                    const spanStart = def.versions.some((v) => !inRange(v)) ? 0 : firstPos;
                    const last = shipped[shipped.length - 1];
                    return (
                      <div
                        key={`${renderKey}-${def.id}`}
                        className={`row lane${def.status === "deprecated" ? " retired" : ""}`}
                        style={
                          {
                            ["--c"]: laneColor,
                            ["--tc"]: DRIFT_TYPE_COLOR[def.type],
                            animationDelay: `${Math.min(laneIndex, 8) * 0.035}s`,
                          } as React.CSSProperties
                        }
                      >
                        <button
                          type="button"
                          className="ln"
                          onClick={() => router.push(`/app/definitions/${def.id}`)}
                        >
                          <span className="tdot" />
                          <div>
                            <b>{def.name}</b>
                            <span>
                              {def.type} · {def.domain} · {def.owner}
                            </span>
                          </div>
                        </button>
                        <div className="track">
                          <span
                            className="span"
                            style={{ left: `${spanStart}%`, width: `${100 - spanStart}%` }}
                          />
                          {visibleVersions.map((v) => {
                            const cls = [
                              v.kind === "pending" ? "pending" : "",
                              v.key === currentKey && def.status !== "deprecated" ? "current" : "",
                              v.kind === "restore" ? "restore" : "",
                              v.kind === "retire" ? "retire" : "",
                            ]
                              .filter(Boolean)
                              .join(" ");
                            return (
                              <button
                                key={v.key}
                                type="button"
                                className={`dot ${cls}`}
                                style={{ left: `${pos(new Date(v.date).getTime())}%` }}
                                aria-label={`${def.name} ${v.v}`}
                                onClick={() =>
                                  setSelected({ definitionId: def.id, versionKey: v.key })
                                }
                              >
                                <span className="tip">
                                  {v.v} ·{" "}
                                  {v.kind === "pending"
                                    ? "awaiting sign-off"
                                    : v.kind === "restore"
                                      ? "restored"
                                      : v.kind === "retire"
                                        ? "retired"
                                        : v.author.name}
                                  <small>
                                    {fmt(new Date(v.date))} · {v.author.name}
                                  </small>
                                </span>
                              </button>
                            );
                          })}
                          {!visibleVersions.length && last && (
                            <span className="quiet">
                              no changes in range · last {last.v} on {fmt(new Date(last.date))}
                            </span>
                          )}
                        </div>
                        <div className="stab" style={{ ["--c" as string]: st.color } as React.CSSProperties}>
                          <b>{st.label}</b>
                          <span>{st.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="legend">
              <span>
                <i className="lg" />
                past version
              </span>
              <span>
                <i className="lg cur" />
                current version
              </span>
              <span>
                <i className="lg pen" />
                awaiting sign-off
              </span>
              <span>
                <i className="lg res" />
                restored
              </span>
              <span style={{ marginLeft: "auto" }}>
                Click any dot to see what changed and why
              </span>
            </div>
          </section>

          {/* ---------- bottom ---------- */}
          <section className="bottom">
            <div className="card">
              <div className="ch">
                <span className="ct">Who moves the logic</span>
                <span className="ct">versions</span>
              </div>
              {movers.length ? (
                movers.map((m) => (
                  <div className="who" key={m.name}>
                    <div className="drift-av" style={{ ["--c" as string]: m.color } as React.CSSProperties}>
                      {m.initials}
                    </div>
                    <span className="nm">{m.name}</span>
                    <div className="bar2">
                      <i
                        style={
                          {
                            width: `${(m.count / movers[0].count) * 100}%`,
                            ["--c"]: m.color,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <span className="n">{m.count}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "12.5px", color: "var(--text2)" }}>
                  No changes in this range.
                </p>
              )}
            </div>

            <div className="card">
              <div className="ch">
                <span className="ct">Worth a conversation</span>
              </div>
              {insights.length ? (
                insights.map((i) => (
                  <div className="ins" key={i.key} style={{ ["--c" as string]: i.color } as React.CSSProperties}>
                    {i.icon}
                    <div>
                      <b>{i.title}</b>
                      <span>{i.body}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "12.5px", color: "var(--text2)" }}>
                  Nothing to flag. Your definitions are holding still.
                </p>
              )}
            </div>

            <div className="card">
              <div className="ch">
                <span className="ct">Recently signed off</span>
              </div>
              {signedOff.length ? (
                signedOff.map(({ def, v }) => (
                  <div className="so" key={v.key}>
                    <div
                      className="drift-av"
                      style={{ ["--c" as string]: v.approver!.color } as React.CSSProperties}
                    >
                      {v.approver!.initials}
                    </div>
                    <div>
                      <b>{def.name}</b>
                      <span>
                        {v.approver!.name} · {fmt(new Date(v.date))}
                      </span>
                    </div>
                    <span className="v">{v.v}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "12.5px", color: "var(--text2)" }}>
                  No approved change requests yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <VersionDrawer selection={selection} onClose={() => setSelected(null)} />
    </div>
  );
}
