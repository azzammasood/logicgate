"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  FileText,
  GitPullRequest,
  Code2,
  Settings,
  LayoutDashboard,
  Sparkles,
  SlidersHorizontal,
  MessageSquare,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useUiStore } from "@/stores/ui";
import { useRecentStore } from "@/stores/recent";
import {
  useAppearanceStore,
  PRESETS,
  applyAppearanceToDocument,
  flashThemeTransition,
  type ThemePreset,
} from "@/stores/appearance";
import { cn } from "@/lib/utils";

const pages = [
  { href: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/app/definitions", label: "Definitions", icon: FileText },
  { href: "/app/changes", label: "Reviews", icon: GitPullRequest },
  { href: "/app/pseudocodes", label: "Pseudocodes", icon: Code2 },
  { href: "/app/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/app/settings", label: "Configuration", icon: Settings },
];

/** Dispatch on `window` to open the palette without a keypress. */
export const OPEN_PALETTE_EVENT = "logicgate:open-palette";

// Two-column tiled grid; arrow keys navigate it spatially (see the keydown
// handler below). `GRID_COLS` must match the `grid-cols-*` used in `gridClass`.
const GRID_COLS = 2;
// The selected state uses a ring (not border/bg), because the light-theme
// overrides force border-white/* and bg-white/* to neutral values and would
// otherwise wash out an accent border/fill entirely.
const tile =
  "flex cursor-pointer flex-row items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80 transition-colors hover:border-white/20 aria-selected:ring-2 aria-selected:ring-[var(--accent)] aria-selected:bg-[var(--accent)]/10 aria-selected:text-[var(--accent)]";
const gridClass = "grid grid-cols-2 gap-1.5";
const headingClass = "px-1 pb-2 pt-1 text-xs text-white/40";

type DefinitionRow = { id: string; name: string; type: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const valueRef = useRef("");
  valueRef.current = value;
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const openPreferences = useUiStore((s) => s.openPreferences);
  const themePreset = useAppearanceStore((s) => s.themePreset);
  const font = useAppearanceStore((s) => s.font);
  const language = useAppearanceStore((s) => s.language);
  const setThemePreset = useAppearanceStore((s) => s.setThemePreset);
  const recentIds = useRecentStore((s) => s.recentIds);

  const { data: definitions = [] } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return (json.data ?? []) as DefinitionRow[];
    },
    enabled: !!workspaceId && open,
  });

  // Only the most-recently-opened definitions (fall back to newest if the user
  // hasn't opened anything yet this session).
  const recentDefinitions = useMemo(() => {
    const byId = new Map(definitions.map((d) => [d.id, d]));
    const recent = recentIds
      .map((id) => byId.get(id))
      .filter((d): d is DefinitionRow => !!d);
    if (recent.length > 0) return recent.slice(0, 6);
    return definitions.slice(0, 6);
  }, [definitions, recentIds]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    // Lets non-keyboard affordances (the sidebar hint) open the palette too.
    const openFromEvent = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener(OPEN_PALETTE_EVENT, openFromEvent);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener(OPEN_PALETTE_EVENT, openFromEvent);
    };
  }, []);

  // Grid-aware arrow navigation. cmdk only moves through items linearly, which
  // feels wrong in a 2-column grid, so we intercept the arrows (capture phase,
  // before cmdk) and drive its controlled `value` to the spatially-correct tile.
  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>("[cmdk-item]")
      ).filter((el) => el.getAttribute("aria-disabled") !== "true" && el.offsetParent !== null);
      if (items.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const values = items.map((el) => el.getAttribute("data-value") ?? "");
      let idx = values.indexOf(valueRef.current);
      if (idx < 0) idx = items.findIndex((el) => el.getAttribute("aria-selected") === "true");
      if (idx < 0) idx = 0;
      let next = idx;
      if (e.key === "ArrowRight") next = Math.min(values.length - 1, idx + 1);
      else if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
      else if (e.key === "ArrowDown") next = Math.min(values.length - 1, idx + GRID_COLS);
      else if (e.key === "ArrowUp") next = idx - GRID_COLS < 0 ? idx : idx - GRID_COLS;
      if (values[next] != null) {
        setValue(values[next]);
        items[next].scrollIntoView({ block: "nearest" });
      }
    };
    root.addEventListener("keydown", onKey, true);
    return () => root.removeEventListener("keydown", onKey, true);
  }, [open]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const applyTheme = (preset: ThemePreset) => {
    flashThemeTransition();
    setThemePreset(preset);
    applyAppearanceToDocument(preset, font, language);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command
        value={value}
        onValueChange={setValue}
        className="lg-pop absolute left-1/2 top-[14%] w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[var(--surface,#161920)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          autoFocus
          placeholder="Search or run a quick action…"
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
        />
        <Command.List className="max-h-[62vh] overflow-y-auto p-3">
          <Command.Empty className="py-6 text-center text-sm text-white/40">
            No results.
          </Command.Empty>

          <Command.Group heading="Quick settings" className={headingClass}>
            <div className={gridClass}>
              <Command.Item
                value="preferences settings"
                onSelect={() => {
                  openPreferences("ai");
                  setOpen(false);
                }}
                className={tile}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Preferences</span>
              </Command.Item>
              <Command.Item
                value="ai model key openrouter change"
                onSelect={() => {
                  openPreferences("ai");
                  setOpen(false);
                }}
                className={tile}
              >
                <Sparkles className="h-4 w-4" />
                <span>AI model &amp; key</span>
              </Command.Item>
            </div>
          </Command.Group>

          <Command.Group heading="Theme" className={headingClass}>
            <div className={gridClass}>
              {(Object.keys(PRESETS) as ThemePreset[]).map((key) => {
                const t = PRESETS[key];
                return (
                  <Command.Item
                    key={key}
                    value={`theme ${t.label}`}
                    onSelect={() => applyTheme(key)}
                    className={cn(tile, "flex-row items-center gap-2")}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                      style={{ background: t.background }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: t.accent }}
                      />
                    </span>
                    <span className="flex-1 truncate">{t.label}</span>
                    {themePreset === key && (
                      <span className="text-[10px] text-[var(--accent)]">•</span>
                    )}
                  </Command.Item>
                );
              })}
            </div>
          </Command.Group>

          <Command.Group heading="Go to" className={headingClass}>
            <div className={gridClass}>
              {pages.map((p) => {
                const Icon = p.icon;
                return (
                  <Command.Item
                    key={p.href}
                    value={p.label}
                    onSelect={() => navigate(p.href)}
                    className={cn(tile, "flex-row items-center gap-2")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{p.label}</span>
                  </Command.Item>
                );
              })}
            </div>
          </Command.Group>

          {recentDefinitions.length > 0 && (
            <Command.Group heading="Recent definitions" className={headingClass}>
              <div className={gridClass}>
                {recentDefinitions.map((d) => (
                  <Command.Item
                    key={d.id}
                    value={`${d.name} ${d.type}`}
                    onSelect={() => navigate(`/app/definitions/${d.id}`)}
                    className={tile}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{d.name}</span>
                      <span className="text-[11px] capitalize text-white/35">
                        {d.type.toLowerCase()}
                      </span>
                    </span>
                  </Command.Item>
                ))}
              </div>
            </Command.Group>
          )}
        </Command.List>
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] text-white/30">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>⌘/Ctrl K</span>
        </div>
      </Command>
    </div>
  );
}
