import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreset =
  | "logicgate"
  | "abyss"
  | "gruvbox-light"
  | "mono"
  | "mono-light"
  | "aubergine";

export type ThemeDef = {
  label: string;
  accent: string;
  background: string;
  surface: string;
  fg: string;
  fgMuted: string;
  border: string;
  light?: boolean;
};

export const PRESETS: Record<ThemePreset, ThemeDef> = {
  logicgate: {
    label: "LogicGate",
    accent: "#4ade80",
    background: "#0d0f14",
    surface: "#161920",
    fg: "#e8eaed",
    fgMuted: "#9aa0aa",
    border: "rgba(255,255,255,0.10)",
  },
  abyss: {
    label: "Null Void",
    accent: "#38bdf8",
    background: "#06080f",
    surface: "#0d1320",
    fg: "#dbe7f5",
    fgMuted: "#8595ad",
    border: "rgba(120,160,220,0.14)",
  },
  "gruvbox-light": {
    label: "Whiteboard",
    accent: "#b57614",
    background: "#fbf1c7",
    surface: "#f2e5bc",
    fg: "#3c3836",
    fgMuted: "#7c6f64",
    border: "rgba(60,56,54,0.16)",
    light: true,
  },
  mono: {
    label: "Terminal",
    // shadcn "Mono" palette — neutral zinc greys with a near-white accent.
    accent: "#e4e4e7",
    background: "#09090b",
    surface: "#18181b",
    fg: "#fafafa",
    fgMuted: "#a1a1aa",
    border: "rgba(255,255,255,0.10)",
  },
  "mono-light": {
    label: "Notebook",
    // shadcn "Mono" light — neutral greys on white with a near-black accent.
    accent: "#18181b",
    background: "#ffffff",
    surface: "#f4f4f5",
    fg: "#09090b",
    fgMuted: "#71717a",
    border: "rgba(0,0,0,0.10)",
    light: true,
  },
  aubergine: {
    label: "Syntax",
    accent: "#c084fc",
    background: "#120d18",
    surface: "#1e1528",
    fg: "#ede4f7",
    fgMuted: "#a594b8",
    border: "rgba(255,255,255,0.10)",
  },
};

export type FontId =
  | "arial"
  | "system"
  | "roboto"
  | "times"
  | "georgia"
  | "verdana"
  | "tahoma"
  | "trebuchet"
  | "courier"
  | "mono"
  | "syne";

export const FONTS: Record<FontId, { label: string; stack: string }> = {
  arial: { label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  system: { label: "System UI", stack: "system-ui, -apple-system, sans-serif" },
  roboto: { label: "Roboto", stack: "'Roboto', system-ui, sans-serif" },
  times: { label: "Times New Roman", stack: "'Times New Roman', Times, serif" },
  georgia: { label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  verdana: { label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  tahoma: { label: "Tahoma", stack: "Tahoma, Geneva, sans-serif" },
  trebuchet: { label: "Trebuchet MS", stack: "'Trebuchet MS', Helvetica, sans-serif" },
  courier: { label: "Courier New", stack: "'Courier New', Courier, monospace" },
  mono: { label: "DM Mono", stack: "var(--font-dm-mono), 'Fira Code', ui-monospace, monospace" },
  syne: { label: "Syne", stack: "var(--font-syne), sans-serif" },
};

export type LanguageId =
  | "en"
  | "ur"
  | "es"
  | "fr"
  | "de"
  | "ar"
  | "hi"
  | "zh"
  | "ja"
  | "pt";

export const LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ur", label: "Urdu (اردو)" },
  { id: "es", label: "Spanish (Español)" },
  { id: "fr", label: "French (Français)" },
  { id: "de", label: "German (Deutsch)" },
  { id: "ar", label: "Arabic (العربية)" },
  { id: "hi", label: "Hindi (हिन्दी)" },
  { id: "zh", label: "Chinese (中文)" },
  { id: "ja", label: "Japanese (日本語)" },
  { id: "pt", label: "Portuguese (Português)" },
];

interface AppearanceState {
  themePreset: ThemePreset;
  font: FontId;
  language: LanguageId;
  setThemePreset: (preset: ThemePreset) => void;
  setFont: (font: FontId) => void;
  setLanguage: (language: LanguageId) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      themePreset: "logicgate",
      font: "mono",
      language: "en",
      setThemePreset: (themePreset) => set({ themePreset }),
      setFont: (font) => set({ font }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "logicgate-appearance",
      version: 1,
      // v1: DM Mono became the default app font (original design mockup).
      // Move users still on the old Arial default over; explicit picks stay.
      migrate: (state, version) => {
        const s = state as AppearanceState;
        if (version < 1 && s.font === "arial") s.font = "mono";
        return s;
      },
    }
  )
);

/** Briefly enables smooth transitions on <html> while an appearance change applies. */
export function flashThemeTransition() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("theme-transition");
  window.setTimeout(() => root.classList.remove("theme-transition"), 380);
}

export function applyAppearanceToDocument(
  themePreset: ThemePreset,
  font: FontId,
  language?: LanguageId
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const preset = PRESETS[themePreset] ?? PRESETS.logicgate;

  root.classList.toggle("light", !!preset.light);
  root.classList.toggle("dark", !preset.light);
  root.style.colorScheme = preset.light ? "light" : "dark";

  root.style.setProperty("--accent", preset.accent);
  root.style.setProperty("--surface", preset.surface);
  root.style.setProperty("--background", preset.background);
  root.style.setProperty("--foreground", preset.fg);
  root.style.setProperty("--fg", preset.fg);
  root.style.setProperty("--fg-muted", preset.fgMuted);
  root.style.setProperty("--border-color", preset.border);

  const fontDef = FONTS[font] ?? FONTS.arial;
  root.style.setProperty("--app-font", fontDef.stack);

  if (language) root.setAttribute("lang", language);
}
