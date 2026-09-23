"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Database, FileCode2, GitCompare, Layers, X, ArrowUpRight } from "lucide-react";
import type { DriftDefinition, DriftKind, DriftVersion } from "@/lib/drift";

const KIND_COLOR: Record<DriftKind, string> = {
  pending: "var(--amber)",
  restore: "var(--purple)",
  retire: "var(--text2)",
  create: "var(--accent)",
  edit: "var(--accent)",
};

const KIND_LABEL: Record<DriftKind, string> = {
  pending: "AWAITING SIGN-OFF",
  restore: "RESTORED",
  retire: "RETIRED",
  create: "CREATED",
  edit: "SHIPPED",
};

function outputIcon(name: string) {
  if (name.endsWith(".py")) return <FileCode2 className="h-3.5 w-3.5" />;
  if (name.endsWith(".dbt")) return <Layers className="h-3.5 w-3.5" />;
  return <Database className="h-3.5 w-3.5" />;
}

/**
 * Right-side drawer for a single version dot: why it changed, what changed,
 * who is accountable and which compiled outputs it touches.
 */
export function VersionDrawer({
  selection,
  onClose,
}: {
  selection: { definition: DriftDefinition; version: DriftVersion } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const open = !!selection;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const definition = selection?.definition;
  const version = selection?.version;
  const kind = version?.kind ?? "edit";
  const color = KIND_COLOR[kind];
  const author = version?.author;

  return (
    <>
      <div
        className={`drift-overlay${open ? " on" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`drift-drawer${open ? " on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={definition ? `${definition.name} ${version?.v}` : "Version details"}
        aria-hidden={!open}
        inert={!open}
      >
        {selection && definition && version && author && (
          <>
            <div className="dh">
              <div className="top">
                <span className="badge" style={{ ["--c" as string]: color }}>
                  {version.v} · {KIND_LABEL[kind]}
                </span>
                <button type="button" className="x" onClick={onClose} aria-label="Close">
                  <X className="h-[15px] w-[15px]" />
                </button>
              </div>
              <h3>{definition.name}</h3>
              <div className="sub">
                {definition.type} · {definition.domain} ·{" "}
                {new Date(version.date).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="db">
              <div className="sec">
                <span className="ct">Why it changed</span>
                <p className="quote" style={{ ["--c" as string]: color }}>
                  {version.reason ? `“${version.reason}”` : "No reason was recorded."}
                </p>
                <div className="by">
                  <div className="drift-av" style={{ ["--c" as string]: author.color }}>
                    {author.initials}
                  </div>
                  {author.name} · {author.role}
                </div>
              </div>

              <div className="sec">
                <span className="ct">What changed</span>
                <div className="diff">
                  {version.removed.length === 0 && version.added.length === 0 ? (
                    <div className="dl none">No logic changes</div>
                  ) : (
                    <>
                      {version.removed.map((l, i) => (
                        <div className="dl rm" key={`r${i}`}>
                          <span className="s">−</span>
                          {l}
                        </div>
                      ))}
                      {version.added.map((l, i) => (
                        <div className="dl ad" key={`a${i}`}>
                          <span className="s">+</span>
                          {l}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="sec">
                <span className="ct">Accountability</span>
                <div className="people">
                  <div className="pp">
                    <div className="drift-av" style={{ ["--c" as string]: author.color }}>
                      {author.initials}
                    </div>
                    <div>
                      <b>{author.name}</b>
                      <span>PROPOSED</span>
                    </div>
                  </div>
                  {version.approver ? (
                    <div className="pp">
                      <div className="drift-av" style={{ ["--c" as string]: version.approver.color }}>
                        {version.approver.initials}
                      </div>
                      <div>
                        <b>{version.approver.name}</b>
                        <span>SIGNED OFF</span>
                      </div>
                    </div>
                  ) : kind === "pending" ? (
                    <div
                      className="pp"
                      style={{ borderStyle: "dashed", borderColor: "rgba(251,191,36,.4)" }}
                    >
                      <div className="drift-av" style={{ ["--c" as string]: "var(--amber)" }}>
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <b>Awaiting review</b>
                        <span style={{ color: "var(--amber)" }}>NOT SIGNED</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pp">
                      <div className="drift-av" style={{ ["--c" as string]: "var(--text2)" }}>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <b>No reviewer</b>
                        <span>PUBLISHED DIRECTLY</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sec">
                <span className="ct">Compiled outputs affected</span>
                <div className="outs">
                  {version.outputs.length ? (
                    version.outputs.map((o) => (
                      <span className="out" key={o}>
                        {outputIcon(o)}
                        {o}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12.5px", color: "var(--text2)" }}>
                      None. Excluded from compiled outputs.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="df">
              <button
                type="button"
                className="drift-btn ghost"
                onClick={() => router.push(`/app/definitions/${definition.id}?tab=changelog`)}
              >
                <GitCompare className="h-4 w-4" />
                Compare with current
              </button>
              <button
                type="button"
                className="drift-btn"
                onClick={() => router.push(`/app/definitions/${definition.id}`)}
              >
                <ArrowUpRight className="h-4 w-4" />
                Open definition
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
