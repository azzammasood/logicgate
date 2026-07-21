"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, ExternalLink, ChevronDown, Zap, Globe, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAiStore } from "@/stores/ai";
import { useAiModels } from "@/hooks/useAiModels";
import {
  SUGGESTED_FREE_MODELS,
  isFreeModel,
  shortModelName,
  type OpenRouterModel,
} from "@/lib/ai/models";
import { cn } from "@/lib/utils";

function ModelOption({
  id,
  name,
  sub,
  selected,
  onSelect,
}: {
  id: string;
  name: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
        selected ? "bg-[var(--accent)]/[0.12]" : "hover:bg-white/5"
      )}
    >
      <Check className={cn("h-3.5 w-3.5 shrink-0", selected ? "text-[var(--accent)]" : "text-transparent")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white/90">{name}</span>
        <span className="block truncate text-[11px] text-white/35">{sub}</span>
      </span>
      {isFreeModel(id) && (
        <span className="shrink-0 rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
          FREE
        </span>
      )}
    </button>
  );
}

/** Dropdown: a general/suggested selection first, then every OpenRouter model. */
function ModelDropdown({
  models,
  loading,
  enabled,
  value,
  onChange,
}: {
  models: OpenRouterModel[];
  loading: boolean;
  /** Whether the full catalog is loadable (AI configured). */
  enabled: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const suggestedIds = new Set(SUGGESTED_FREE_MODELS.map((m) => m.id));
  const q = search.trim().toLowerCase();

  const allSorted = useMemo(() => {
    const list = q
      ? models.filter((m) => m.id.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q))
      : models.filter((m) => !suggestedIds.has(m.id));
    return [...list].sort((a, b) => {
      const fa = isFreeModel(a.id) ? 0 : 1;
      const fb = isFreeModel(b.id) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return (a.name ?? a.id).localeCompare(b.name ?? b.id);
    });
  }, [models, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestedShown = q
    ? SUGGESTED_FREE_MODELS.filter(
        (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
      )
    : SUGGESTED_FREE_MODELS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-[var(--background,#0d0f14)] px-3 py-2 text-left text-sm transition-colors hover:border-white/20"
      >
        <span className="min-w-0 flex-1 truncate text-white/90">{shortModelName(value)}</span>
        {isFreeModel(value) && (
          <span className="rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
            FREE
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-white/10 bg-[#161920] shadow-2xl">
          <div className="relative border-b border-white/10 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${models.length || ""} models…`}
              className="bg-[var(--background,#0d0f14)] pl-8"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {suggestedShown.length > 0 && (
              <>
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/30">
                  Suggested
                </p>
                {suggestedShown.map((m) => (
                  <ModelOption
                    key={m.id}
                    id={m.id}
                    name={m.name}
                    sub={m.note}
                    selected={value === m.id}
                    onSelect={() => {
                      onChange(m.id);
                      setOpen(false);
                      setSearch("");
                    }}
                  />
                ))}
              </>
            )}

            <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">
              All models
            </p>
            {!enabled && (
              <p className="px-2 py-2 text-xs text-white/40">
                Add an API key to browse every OpenRouter model.
              </p>
            )}
            {enabled && loading && (
              <div className="flex items-center gap-2 px-2 py-3 text-xs text-white/45">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                Loading models…
              </div>
            )}
            {enabled &&
              !loading &&
              allSorted.map((m) => (
                <ModelOption
                  key={m.id}
                  id={m.id}
                  name={m.name ?? m.id}
                  sub={m.id}
                  selected={value === m.id}
                  onSelect={() => {
                    onChange(m.id);
                    setOpen(false);
                    setSearch("");
                  }}
                />
              ))}
            {enabled && !loading && allSorted.length === 0 && suggestedShown.length === 0 && (
              <p className="px-2 py-2 text-xs text-white/40">No models match your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AiSettingsSection() {
  const apiKey = useAiStore((s) => s.apiKey);
  const model = useAiStore((s) => s.model);
  const baseUrl = useAiStore((s) => s.baseUrl);
  const webGrounding = useAiStore((s) => s.webGrounding);
  const setApiKey = useAiStore((s) => s.setApiKey);
  const setModel = useAiStore((s) => s.setModel);
  const setBaseUrl = useAiStore((s) => s.setBaseUrl);
  const setWebGrounding = useAiStore((s) => s.setWebGrounding);

  const isCustomEndpoint = baseUrl.trim().length > 0;
  const available = apiKey.trim().length > 0 || isCustomEndpoint;

  const { data: allModels = [], isLoading, isFetching } = useAiModels();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
          <Zap className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">OpenRouter (AI)</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-white/45">
            Optional but recommended. Powers AI features like turning plain English into
            definitions.
          </p>
        </div>
      </div>

      {/* API key */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/60">API key</label>
        <PasswordInput
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-…"
          className="bg-[var(--background,#0d0f14)] font-mono text-xs"
        />
        <p className="text-[11px] text-white/35">
          Stored locally, never sent to a server.{" "}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline"
          >
            Get a free key <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      {/* Custom base URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/60">Custom base URL</label>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://openrouter.ai/api/v1 (default)"
          className="bg-[var(--background,#0d0f14)] font-mono text-xs"
        />
        <p className="text-[11px] text-white/35">
          Override the provider URL. Useful for Ollama, LM Studio, vLLM, or other OpenAI-compatible
          endpoints.
        </p>
      </div>

      {/* Model dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/60">Model</label>
        <ModelDropdown
          models={allModels}
          loading={isLoading || isFetching}
          enabled={available}
          value={model}
          onChange={setModel}
        />
      </div>

      {/* Web grounding — only meaningful on OpenRouter */}
      {!isCustomEndpoint && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-[var(--background,#0d0f14)] p-3">
          <input
            type="checkbox"
            checked={webGrounding}
            onChange={(e) => setWebGrounding(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm text-white/90">
              <Globe className="h-3.5 w-3.5 text-white/50" />
              Web grounding
            </span>
            <span className="mt-0.5 block text-[11px] text-white/40">
              Let the model search the web for up-to-date context (OpenRouter web plugin).
            </span>
          </span>
        </label>
      )}

      {/* Availability status */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
          available
            ? "border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] text-[var(--accent)]"
            : "border-white/10 bg-white/[0.03] text-white/45"
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", available ? "bg-[var(--accent)]" : "bg-white/30")} />
        {available ? (
          <span>
            AI is available — using{" "}
            <span className="font-medium">{shortModelName(model)}</span>
            {isCustomEndpoint ? " via your custom endpoint" : ""}.
          </span>
        ) : (
          <span>AI not available — add an API key (or a custom base URL) above.</span>
        )}
      </div>
    </div>
  );
}
