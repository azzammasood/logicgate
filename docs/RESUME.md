# Resume LogicGate on a new machine

## 1. Clone

```bash
git clone https://github.com/azzammasood/logicgate.git
cd logicgate
```

## 2. Install dependencies

```bash
npm install
```

Requires Node.js 20+ (LTS recommended).

## 3. Environment

```bash
cp .env.example .env.local
```

Fill in Supabase values from your existing project (Dashboard → Settings → API + Database).

If you only need the **marketing site** locally, you still need placeholder values for build, or copy real keys from your password manager.

## 4. Database (app only)

```bash
npm run db:push
```

Skip if you only preview marketing and don't have DB access yet.

## 5. Run

```bash
npm run dev
```

Open:

- Marketing: http://localhost:3000/
- App: http://localhost:3000/app/definitions (after login)
- Login: http://localhost:3000/login

## 6. Open in Cursor / Codex

1. Open the `logicgate` folder as workspace root.
2. Tell the AI to read **`CONTEXT.md`** and **`AGENTS.md`** before making changes.
3. Paste the starter prompt from `docs/RESUME.md` (bottom section) or `CONTEXT.md`.

## 7. Verify

```bash
npm run type-check
npm run build
```

## Files the AI should read

| File | Purpose |
|------|---------|
| `CONTEXT.md` | Project state, marketing phases, structure |
| `AGENTS.md` | Coding rules, route groups, conventions |
| `README.md` | Full architecture & API docs |
| `docs/FIRST_RUN.md` | Product onboarding |
| `docs/DEPLOY.md` | Vercel + Supabase deploy |

## Starter prompt (copy into Cursor/Codex)

```
I'm resuming work on LogicGate. Read CONTEXT.md and AGENTS.md in the repo root before doing anything.

Repo: Next.js 16 App Router monorepo with:
- Marketing site at src/app/(marketing)/ — /, /features, /accountability, /security
- Product app at src/app/app/ — definitions, approvals, etc.
- Auth at src/app/(auth)/login and signup

Marketing is complete through Phase 6 (layout, 4 pages, interactive See It In Action with live compiler + syntax highlighting + compile animation). Waitlist form is UI-only.

Do not use shadcn on marketing pages. Do not touch auth/app routes unless I ask.

Confirm you've read CONTEXT.md, summarize current state in 5 bullets, then ask what I want to work on next.
```
