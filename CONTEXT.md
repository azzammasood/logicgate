# LogicGate — project context (read this when resuming)

Last updated: June 2026. Use this file + `AGENTS.md` when opening the repo in Cursor, Codex, or Claude on a new machine.

## What LogicGate is

A **data definition management** product: stakeholders define metrics/rules visually; engineers review; definitions version and compile to Generic / SQL / Python / dbt.

Two surfaces in **one Next.js 16 repo**:

| Surface | Routes | Layout |
|---------|--------|--------|
| **Marketing site** | `/`, `/features`, `/accountability`, `/security` | `src/app/(marketing)/layout.tsx` |
| **Product app** | `/login`, `/signup`, `/app/*` | `src/app/app/layout.tsx` + root layout |

**Do not** put marketing nav on auth/app routes. **Do not** use shadcn in marketing — plain CSS + Tailwind/inline only.

## Marketing site (recent work — complete through Phase 6)

### Structure

```
src/app/(marketing)/
  layout.tsx          # Navbar, Footer, ScrollReveal, fonts, grid overlay
  globals-marketing.css
  page.tsx            # Homepage (Hero, Problem, How It Works, See It In Action)
  features/page.tsx
  accountability/page.tsx
  security/page.tsx

src/components/marketing/
  Navbar.tsx, Footer.tsx, SectionDivider.tsx, Reveal.tsx, ScrollReveal.tsx
  MarketingLogo.tsx
  home/               # Hero, Problem, HowItWorks, SeeItInAction, WaitlistForm, etc.
  features/FeatureIcons.tsx
  security/SecurityIcons.tsx

src/lib/marketing/
  demo-compile.ts     # Wires demo filters → @/lib/compiler
  highlight-code.tsx  # Syntax colors for compiled output panel
```

### Design tokens (marketing only — do not deviate)

- Background: `#080a0f` (`--bg`)
- Accent: `#4ade80` — CTAs, eyebrows, highlights only (not body text)
- Headings: **Satoshi** (Fontshare), weight 900, `letter-spacing: -3px` or tighter
- Body: **Inter** (Google Fonts)
- Code: **JetBrains Mono** only

### Interactive homepage section

**See It In Action** (`SeeItInActionSection.tsx`):

- Left: editable filter rows (status, type exclusions, is_internal, amount_usd)
- Right: live compile via `compile()` from `src/lib/compiler/index.ts`
- Format tabs: Generic, SQL, Python, dbt
- `CompileOutputPanel.tsx`: ~620ms loading animation with LogicGate logo + syntax highlighting

Waitlist form (`WaitlistForm.tsx`): UI only, button text **Join waitlist →**, `id="waitlist"`.

### Scroll reveal

- Layout wraps children in `ScrollReveal` (Intersection Observer on `.reveal` class)
- Pages use `<Reveal>` wrapper components, not per-element observers

### Deployment intent

Marketing can deploy to Vercel (free) + cheap domain. Full app needs real Supabase env vars. See conversation notes: placeholder env vars OK for marketing-only build.

## Product app (existing + in-progress changes)

- Visual definition builder: `src/components/definitions/`
- Compiler: `src/lib/compiler/index.ts` (+ tests)
- Auth: Supabase SSR, `(auth)/login`, `(auth)/signup`
- API routes under `src/app/api/`
- Prisma schema: `prisma/schema.prisma`

Recent additions (uncommitted batch): notifications API, discussions, feedback, pseudocodes page, snapshot compare, documentation section, roles/permissions updates.

## Commands

```bash
npm install
cp .env.example .env.local   # then fill in Supabase values
npm run db:push              # needs .env.local
npm run dev                  # http://localhost:3000
npm run type-check
npm run build
```

## Environment

Required for **app**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`.

Marketing pages build without DB at runtime, but `npm run build` runs `prisma generate`.

## Key conventions

1. **Minimize scope** — focused diffs; don't refactor unrelated code.
2. **Route groups** — `(marketing)`, `(auth)`, `app/` are isolated layouts.
3. **No `any`** in marketing TypeScript.
4. Read `node_modules/next/dist/docs/` before Next.js API changes (Next 16 differs from training data).
5. Only commit when asked; repo owner controls git.

## What to do next (suggested backlog)

- [ ] Wire waitlist form to backend (Formspree, Supabase table, or API route)
- [ ] Deploy marketing to Vercel + custom domain
- [ ] Optional: `robots.txt` disallow `/app`, `/login` on marketing domain
- [ ] Optional: `MARKETING_ONLY` middleware to redirect app routes on marketing deploy
- [ ] Continue app features (notifications UI, pseudocodes, etc.)

## Git remote

`origin` → `https://github.com/azzammasood/logicgate.git` (branch `main`)
