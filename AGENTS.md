# LogicGate — agent instructions

Read **`CONTEXT.md`** first for project state, route map, and recent marketing work.

<!-- BEGIN:nextjs-agent-rules -->
## Next.js

This is **Next.js 16** with breaking changes vs older versions. Read guides in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repository layout

```
src/app/
  (marketing)/     # Public site — Navbar + Footer, NO app UI libraries
  (auth)/          # login, signup — no marketing nav
  app/             # Dashboard product (/app/*)
  api/             # Route handlers
src/components/
  marketing/       # Marketing-only components
  definitions/     # Visual builder (product)
  ui/              # shadcn — product only, NOT marketing
src/lib/
  compiler/        # Generic, SQL, Python, dbt compile()
  marketing/       # Demo compile + syntax highlight for landing
prisma/schema.prisma
```

## Marketing site rules (strict)

- Design tokens in `src/app/(marketing)/globals-marketing.css` — use CSS variables (`--bg`, `--text`, `--accent`, etc.), avoid hardcoding hex when a variable exists.
- Fonts: Satoshi (headings), Inter (body), JetBrains Mono (all code).
- Accent `#4ade80` only for: CTAs, eyebrows, active states, highlights, checkmarks, hover accents.
- H1/H2 Satoshi 900 with `letter-spacing: -2px` or tighter.
- No shadcn/Radix on marketing pages.
- Never modify `(auth)/` or `app/` when doing marketing-only tasks unless explicitly asked.

## Product app rules

- Uses shadcn/ui, TanStack Query, Zustand, Supabase auth.
- Permissions: `src/lib/permissions.ts`, roles: `src/lib/roles.ts`.
- Compiler tests: `src/lib/compiler/__tests__/compiler.test.ts`.

## Code style

- TypeScript strict; no `any` in marketing.
- Match existing patterns in the file you're editing.
- Minimal diffs; no drive-by refactors.
- Don't add tests unless requested or clearly valuable.

## Scripts

| Command | Use |
|---------|-----|
| `npm run dev` | Local dev (prisma generate + next dev) |
| `npm run build` | Production build |
| `npm run type-check` | `tsc --noEmit` |
| `npm run db:push` | Push schema (needs `.env.local`) |

## Secrets

- Never commit `.env`, `.env.local`, or credentials.
- Use `.env.example` as template.

## Git

- Only create commits when the user explicitly asks.
- Remote: `https://github.com/azzammasood/logicgate.git`
