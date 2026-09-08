# LogicGate — agent guide

LogicGate is a **data-definition management** product. Stakeholders define business
metrics/rules visually; engineers review; every change is versioned and compiles to
Generic / SQL / Python / dbt. One Next.js repo hosts three surfaces: a marketing site,
auth, and the product app.

> Supplementary (may be partially stale): `AGENTS.md`, `CONTEXT.md`. **This file is the
> authoritative current-state doc** — prefer it on conflicts.

**Live in production** at **https://logicgate.space** (see the Deployment section). The
creator is Ahmad Uzzam Masood (solo). Contact links live in the in-app docs About section
(`DocsDialog`): email `ahmaduzzammasood@gmail.com`, `github.com/azzammasood`,
`linkedin.com/in/azzammasood`.

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
  auth/callback/   # OAuth code→session exchange (server route)
  app/             # product (/app/*): dashboard, definitions, reviews,
                   #   pseudocodes, discussions, stakeholders, settings, settings/integrations
  api/             # route handlers (Prisma-backed; auth-guarded by proxy)
src/proxy.ts       # Next 16 middleware (the "proxy" convention): auth guard for /app + /api,
                   #   rate limiting. NOTE: file MUST be proxy.ts, not middleware.ts —
                   #   Next 16 errors if both exist.
src/components/
  marketing/  definitions/  layout/  account/  ai/  auth/  ui/(shadcn)  settings/  landing/
src/lib/
  ai/          # openrouter, parseDefinition, assist, models  (+ __tests__)
  compiler/    # compile() → Generic/SQL/Python/dbt (+ __tests__)
  marketing/   # demo-compile, highlight-code (landing "see it in action")
  supabase/    # client.ts, server.ts, middleware.ts (updateSession helper, used by proxy.ts)
src/stores/    # workspace, ui, ai, appearance (all zustand; ai+appearance persisted)
prisma/schema.prisma
next.config.ts # ⚠ contains the CSP — see gotchas
vercel.json    # framework + buildCommand only (env lives in Vercel dashboard)
```

**App route ↔ nav label now match 1:1** (renamed so URLs aren't confusing): `/app/dashboard`
=Dashboard, `/app/reviews`=Reviews (was `changes`), `/app/stakeholders`=Stakeholders (was
`team`), `/app/settings`=Settings, plus Definitions/Pseudocodes/Discussions. If you rename a
route, `git mv` the folder AND grep-replace every `"/app/<old>"` string, then delete `.next`
before rebuilding (stale `.next/**/validator.ts` references the old path and fails type-check).

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
4. **Email confirmation is ON and SMTP is now configured** (Brevo relay, sender
   `noreply@logicgate.space`, DKIM/DMARC authenticated on the domain). Verification +
   magic-link emails deliver in production. All SMTP/DNS config is dashboard-side, not code.
   Signup still shows a "verify your email" screen with a magic-link fallback.
5. Do **not** send OpenRouter custom headers (`HTTP-Referer`/`X-Title`) or `Authorization`
   to the public `/models` endpoint from the browser — they trip CORS preflight. `/models`
   is public; only self-hosted custom base URLs get `Authorization`.
6. `valueType` enum is **`STRING|NUMBER|BOOLEAN|ARRAY|NULL`** (no `DATE`). The AI parser
   coerces stray types; keep it aligned with `lib/validators.ts` + Prisma `ValueType`.

## Key systems

- **Auth** (`src/proxy.ts` + `lib/supabase`): redirects unauthenticated `/app/*` to
  `/login`, returns 401 for `/api/*`. Post-login landing is **`/app/dashboard`**.
  `/api/auth/me` self-provisions the user row (avoids "account stuck loading").
  - **Email/password + magic link** on `(auth)/login` + `(auth)/signup`. Signup collects
    only identity (name, email, password, role); workspace setup happens on first sign-in
    via `WorkspaceProvider` → `CreateWorkspaceDialog`, not on the signup form.
  - **OAuth (Google + GitHub)** via `OAuthButtons` → `supabase.auth.signInWithOAuth`. The
    Supabase project callback is `https://<ref>.supabase.co/auth/v1/callback` (registered in
    the Google/GitHub apps). Supabase then redirects to the **Site URL** with `?code=`;
    `src/app/auth/callback/route.ts` exchanges it for a session. Because Supabase sends the
    code to the Site URL root, `components/auth/OAuthCodeCatcher.tsx` (mounted in the
    marketing layout) forwards a stray `?code=` on `/` to `/auth/callback`. **Site URL +
    redirect allowlist in Supabase must be `https://logicgate.space` / `…/**`.**
  - A successful sign-in briefly flips the session before the redirect; login/signup guard
    the "you're already signed in" (`ContinueAsUser`) branch behind a `signingIn` flag so it
    only shows for people who arrive already authenticated.
- **Workspaces / orgs**: `stores/workspace.ts`. Left rail = org switcher; clicking the
  active org opens a details popover (Edit → settings). Switching orgs while a definition
  is open navigates back to the list (and the `[id]` page guards against rendering a
  foreign-workspace definition). Org name is locked once other members join. Personal
  (solo) workspaces are supported. **Invite flow is implemented** (no longer a stub):
  `GET /api/invite/[token]` verifies a code and returns the org name/logo/member-count
  without joining; `POST` joins (as `VIEWER`). `CreateWorkspaceDialog` and `/invite/[token]`
  both verify-then-confirm before joining. Admin generates/rotates the code at
  `POST /api/workspaces/[id]/invite` (stored in `workspaceSettings.inviteCode`).
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

## Deployment (production)

- **Host: Vercel** (Hobby/free), project `trylogicgate` under team `azzammasoods-projects`.
  Deploy with `npx vercel --prod --yes` from the repo root (the CLI is authed via device
  login; a stale/expired token shows "token is not valid" → re-run `npx vercel login`). The
  build sometimes prints `"status":"error"` on the *first* invocation then succeeds on retry.
  `vercel.json` sets `buildCommand: "prisma generate && next build"`; **env vars live in the
  Vercel dashboard**, not `vercel.json` (its `env` must be an object, never an array).
- **Domain: `logicgate.space`** (registered at Hostinger; DNS at Hostinger). `@`→Vercel A
  record, `www`→Vercel CNAME. The auto-generated `logicgate-coral.vercel.app` still resolves.
  Custom-branded auth domain (hiding `supabase.co` on OAuth consent) needs Supabase Pro — not
  done (free tier).
- **DB + Auth: Supabase**, project ref **`fkbxuvrlxyadehjcoxhn`**. Env vars (in Vercel):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (new `sb_publishable_…` format),
  `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler :6543), `DIRECT_URL` (:5432),
  `FEEDBACK_OWNER_EMAIL`.
- **Prisma 7**: connection URLs live in **`prisma.config.ts`** (`DIRECT_URL` for schema
  ops), NOT in `schema.prisma` (Prisma 7 rejects `url`/`directUrl` in the datasource block).
- **Email: Brevo SMTP** (see gotcha 4). **OAuth apps**: Google Cloud + GitHub OAuth apps
  owned by the creator; secrets set in Supabase → Auth → Providers.
- **Favicon**: `src/app/icon.svg` (LogicGate glyph). A one-off PNG export of the logo lives
  gitignored at repo root (`logicgate-logo-512.png`).

## Common commands

| Command | Use |
|---------|-----|
| `npm run dev` | Local dev on :3001 (prisma generate + next dev) |
| `npm run type-check` | `tsc --noEmit` |
| `npx jest src/lib/ai/__tests__/parseDefinition.test.ts` | AI parser tests |
| `npm run db:push` | Push Prisma schema (needs pooler `.env.local`) |
| `npm run build` | Production build |
| `npx vercel --prod --yes` | Deploy to production (retry once if it errors) |
