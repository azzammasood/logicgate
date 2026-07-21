"use client";

import { cn } from "@/lib/utils";
import {
  useAppearanceStore,
  type ThemePreset,
  type FontId,
  type LanguageId,
  PRESETS,
  FONTS,
  LANGUAGES,
  applyAppearanceToDocument,
  flashThemeTransition,
} from "@/stores/appearance";

export function ThemeSettings() {
  const themePreset = useAppearanceStore((s) => s.themePreset);
  const font = useAppearanceStore((s) => s.font);
  const language = useAppearanceStore((s) => s.language);
  const setThemePreset = useAppearanceStore((s) => s.setThemePreset);

  function pick(preset: ThemePreset) {
    flashThemeTransition();
    setThemePreset(preset);
    applyAppearanceToDocument(preset, font, language);
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--fg)]">Theme</h3>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">Pick a colour theme for the whole app.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(Object.keys(PRESETS) as ThemePreset[]).map((key) => {
          const t = PRESETS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                themePreset === key
                  ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                  : "border-[var(--border-color)] hover:bg-white/5"
              )}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ background: t.background }}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: t.accent }} />
              </span>
              <span className="text-[var(--fg)]">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FontSettings() {
  const themePreset = useAppearanceStore((s) => s.themePreset);
  const font = useAppearanceStore((s) => s.font);
  const language = useAppearanceStore((s) => s.language);
  const setFont = useAppearanceStore((s) => s.setFont);

  function pick(f: FontId) {
    flashThemeTransition();
    setFont(f);
    applyAppearanceToDocument(themePreset, f, language);
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--fg)]">Font</h3>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">Interface typeface (applies everywhere).</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(Object.keys(FONTS) as FontId[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => pick(key)}
            style={{ fontFamily: FONTS[key].stack }}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              font === key
                ? "border-[var(--accent)] ring-1 ring-[var(--accent)] text-[var(--fg)]"
                : "border-[var(--border-color)] text-[var(--fg-muted)] hover:bg-white/5"
            )}
          >
            {FONTS[key].label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LanguageSettings() {
  const themePreset = useAppearanceStore((s) => s.themePreset);
  const font = useAppearanceStore((s) => s.font);
  const language = useAppearanceStore((s) => s.language);
  const setLanguage = useAppearanceStore((s) => s.setLanguage);

  function pick(l: LanguageId) {
    setLanguage(l);
    applyAppearanceToDocument(themePreset, font, l);
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--fg)]">Language</h3>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">Sets your preferred display language.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => pick(l.id)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
              language === l.id
                ? "border-[var(--accent)] ring-1 ring-[var(--accent)] text-[var(--fg)]"
                : "border-[var(--border-color)] text-[var(--fg-muted)] hover:bg-white/5"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Combined view (kept for any callers that want all sections at once). */
export function AppearanceSettings() {
  return (
    <div className="space-y-8">
      <ThemeSettings />
      <FontSettings />
      <LanguageSettings />
    </div>
  );
}
