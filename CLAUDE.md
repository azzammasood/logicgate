# LogicGate — agent guide

LogicGate is a **data-definition management** product. Stakeholders define business
metrics/rules visually; engineers review; every change is versioned and compiles to
Generic / SQL / Python / dbt. One Next.js repo hosts three surfaces: a marketing site,
auth, and the product app.

> Supplementary (may be partially stale): `AGENTS.md`, `CONTEXT.md`. **This file is the
> authoritative current-state doc** — prefer it on conflicts.

---

## Run / verify

- **Dev server runs on port 3001.** `npm run dev` → `prisma generate && next dev -p 3001`.
  The user usually starts it themselves via **`start-logicgate.cmd`** (repo root). Don't
  assume it's running; a corrupted `.next` can cause blanket 404s — fix with
  `Remove-Item -Recurse -Force .next` then restart.
- **Before saying "done": `npm run type-check`** (tsc --noEmit). Stale generated types can
  throw phantom errors in `.next/dev/types` — delete that folder and re-run.
- **AI parsing is unit-tested:** `npx jest src/lib/ai/__tests__/parseDefinition.test.ts`.
  Keep it green when touching `lib/ai/*`.
- Shell is **PowerShell** (primary) + a Bash tool. Kill stray servers with
  `Get-Process node | Stop-Process -Force`.

## Stack

Next.js **16.2.6** (Turbopack, App Router) · React 19 · TypeScript strict · Tailwind **v4**
· Prisma 7 · Supabase (Postgres + SSR auth) · TanStack Query · Zustand · shadcn/base-ui
(product only) · zod · cmdk · sonner.

Next 16 has breaking changes vs older versions — read `node_modules/next/dist/docs/` before
using unfamiliar Next APIs.

## Repository layout

```
src/app/
  (marketing)/     # public site — plain CSS + JetBrains Mono, NO shadcn/Radix
  (auth)/          # login, signup, reset-password (JetBrains Mono via (auth)/layout)
  app/             # product (/app/*): dashboard, definitions, changes(reviews),
                   #   pseudocodes, discussions, team, settings, settings/integrations
  api/             # route handlers (Prisma-backed; auth-guarded by middleware)
src/middleware.ts  # auth guard for /app + /api (NOTE: Next 16 warns "use proxy" — still works)
src/components/
  marketing/  definitions/  layout/  account/  ai/  ui/(shadcn)  settings/  landing/
src/lib/
  ai/          # openrouter, parseDefinition, assist, models  (+ __tests__)
  compiler/    # compile() → Generic/SQL/Python/dbt (+ __tests__)
  supabase/    # client.ts, server.ts, middleware.ts (updateSession)
src/stores/    # workspace, ui, ai, appearance (all zustand; ai+appearance persisted)
prisma/schema.prisma
next.config.ts # ⚠ contains the CSP — see gotchas
```

## Critical gotchas (learned the hard way — read before debugging)

1. **AI runs entirely client-side.** The user's OpenRouter key lives in `localStorage`
   (`stores/ai.ts`) and is sent straight from the browser to the provider — **never to our
   server**. There is no `/api/ai/*` route. If you "fix" AI by proxying server-side you
   break the privacy promise and local endpoints (Ollama/LM Studio).
2. **CSP blocks browser fetches.** `next.config.ts` sets a Content-Security-Policy;
   `connect-src` must list every host the browser calls: `'self'`, the Supabase host,
   `https://openrouter.ai`, and `http://localhost:*`/`127.0.0.1:*`. Symptom of a missing
   host: fetch fails with "no request/response" in devtools while `curl` works (CSP is
   browser-only). **Editing `next.config.ts` requires a full server restart.**
3. **Supabase DB uses the pooler, not the direct host.** `db.<ref>.supabase.co` is
   IPv6-only and unreachable here (Prisma P1001). `.env.local` uses the **transaction
   pooler** (`…pooler.supabase.com:6543?pgbouncer=true`) for `DATABASE_URL` and the
   **session pooler** (`:5432`) for `DIRECT_URL`. Password's `#` is URL-encoded `%23`.
4. **Email confirmation is ON in Supabase but SMTP isn't configured** → verification
   emails often don't deliver. That's a Supabase dashboard setting, not a code bug. Signup
   shows a "verify your email" screen with a magic-link fallback; magic links do send.
5. Do **not** send OpenRouter custom headers (`HTTP-Referer`/`X-Title`) or `Authorization`
   to the public `/models` endpoint from the browser — they trip CORS preflight. `/models`
   is public; only self-hosted custom base URLs get `Authorization`.
6. `valueType` enum is **`STRING|NUMBER|BOOLEAN|ARRAY|NULL`** (no `DATE`). The AI parser
   coerces stray types; keep it aligned with `lib/validators.ts` + Prisma `ValueType`.

## Key systems

- **Auth** (`src/middleware.ts` + `lib/supabase`): redirects unauthenticated `/app/*` to
  `/login`, returns 401 for `/api/*`. Post-login landing is **`/app/dashboard`**.
  `/api/auth/me` self-provisions the user row (avoids "account stuck loading").
- **Workspaces / orgs**: `stores/workspace.ts`. Left rail = org switcher; clicking the
  active org opens a details popover (Edit → settings). Switching orgs while a definition
  is open navigates back to the list (and the `[id]` page guards against rendering a
  foreign-workspace definition). Org name is locked once other members join. Personal
  (solo) workspaces are supported; onboarding also allows "join existing" via invite link
  (invite acceptance backend is still a **stub**).
- **Definitions**: 3-column layout (`app/definitions/layout.tsx`) — list · builder ·
  auto-compiled pseudocode sidebar. Detail tabs: Visual Builder / Changelog / Discuss /
  Settings (**no** Pseudocode tab — it's the right sidebar only). Autosave drafts;
  **Publish** records an immutable version (like a git commit). Change requests gate edits
  behind an approver.
- **AI features** (all optional, click-initiated, client-side):
  - **NL → conditions** (`AiDefinitionPrompt` → `parseDefinition`): plain English becomes
    condition blocks. Robust parser (`extractJson` + item-by-item validation, never throws
    on structure). Default model **`openrouter/free`** ("Free Models Router").
  - **Change-reason suggester** (`AiAssistButton` + `assist.suggestChangeReason`) in
    Publish + Change-Request dialogs (diffs current vs last version).
  - **Documentation generator** (`assist.generateDocumentation`) in the builder's
    Documentation section.
  - A **no-key banner** (`ai/AiKeyBanner`) shows app-wide until a key/base-URL is set.
  - Model catalog loads only when configured (`hooks/useAiModels`), prefetched in AppShell.
- **Preferences dialog** (`account/PreferencesDialog`, opened from the account menu, the AI
  banner, or Ctrl+K) — sections: **AI** (OpenRouter key, custom base URL, model dropdown
  with suggested-then-all, web grounding) and **Appearance** (theme + font). Controlled by
  `ui.preferencesOpen` and rendered once in `AppShell`.
- **Command palette** (`CommandPalette`, ⌘/Ctrl+K): quick settings (themes apply live,
  AI model), page nav, and definition search. Input autofocuses; arrow keys navigate.
- **Appearance** (`stores/appearance.ts`): theme presets + font applied via CSS vars on
  `<html>`; `flashThemeTransition()` briefly enables smooth color transitions.

## Conventions & style

- **TypeScript strict; no `any` in marketing.** Match the surrounding file's patterns,
  comment density, and idioms. Minimal diffs — no drive-by refactors.
- **Marketing** = plain CSS + Tailwind/inline, JetBrains Mono, accent `#4ade80`; **never**
  use shadcn/Radix there. Product app = shadcn/base-ui + theme CSS vars
  (`--accent`, `--surface`, `--fg`, `--border-color`, `--app-font`).
- **Shared motion utilities** (`globals.css`): `.hover-glow` (the app-wide hover — NOT
  translate/shift), `.lg-pop` (fast popovers), `.lg-fade-up`, `.lg-stagger`,
  `.lg-skeleton`, `.app-page-transition`, `.theme-transition`. Everything respects
  `prefers-reduced-motion`. The animated brand logo must stay green (not theme accent) and
  only animate (no hover lift/glow).
- Loading = skeletons, not a redundant `PageLoader` overlay (a fixed backdrop-blur card
  over a pulsing skeleton janks — that pattern was removed).
- Don't add tests unless requested or clearly valuable (the AI parser is the exception).
- **Only commit when explicitly asked.** Remote: `github.com/azzammasood/logicgate.git`.
- Never commit `.env*` or credentials.

## Common commands

| Command | Use |
|---------|-----|
| `npm run dev` | Local dev on :3001 (prisma generate + next dev) |
| `npm run type-check` | `tsc --noEmit` |
| `npx jest src/lib/ai/__tests__/parseDefinition.test.ts` | AI parser tests |
| `npm run db:push` | Push Prisma schema (needs pooler `.env.local`) |
| `npm run build` | Production build |
