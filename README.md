# LogicGate

**LogicGate** is a collaborative platform for defining, versioning, and exporting business metrics and data rules. Engineers build definitions visually; stakeholders review changes; every publish creates an immutable version snapshot with a commit-style message.

Built with **Next.js 16**, **Supabase Auth**, **PostgreSQL (Prisma)**, and **React Query**.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [System architecture](#system-architecture)
- [Application layers](#application-layers)
- [Data model](#data-model)
- [Authentication flow](#authentication-flow)
- [Definition lifecycle](#definition-lifecycle)
- [Pseudocode compiler](#pseudocode-compiler)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

| Area | Capabilities |
|------|-------------|
| **Definitions** | Visual builder for metrics, rules, filters, and flags with conditions, aggregation, and source mapping |
| **Version control** | Git-style publish flow — drafts autosave silently; versions are recorded only on publish with a message |
| **Change requests** | Stakeholders propose changes; approvers review before publishing |
| **Pseudocode export** | Auto-compiled output in Generic, SQL, Python, and dbt formats |
| **Collaboration** | Per-definition comments, multi-owner support, approver assignment |
| **Workspaces** | Multi-tenant organizations with role-based access (Owner / Editor / Viewer) |
| **Theming** | Slack-inspired theme presets, font selection, and language preferences |
| **Integrations** | Webhook and dbt project URL configuration per workspace |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) + Base UI |
| State | [TanStack Query](https://tanstack.com/query) (server state), [Zustand](https://zustand.docs.pmnd.rs/) (client state) |
| Auth | [Supabase Auth](https://supabase.com/docs/guides/auth) (SSR cookie sessions) |
| Database | PostgreSQL via [Prisma 7](https://www.prisma.io/) |
| Storage | Supabase Storage (avatars, workspace logos) |
| Validation | [Zod 4](https://zod.dev/) |
| Testing | Jest, Playwright |
| Deployment | Vercel-ready (`vercel.json` included) |

---

## System architecture

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["Next.js App<br/>(React + TanStack Query)"]
        ZS["Zustand Stores<br/>(appearance, workspace, overlay)"]
    end

    subgraph NextServer["Next.js Server"]
        MW["Middleware<br/>(session refresh + route guard)"]
        RSC["App Router<br/>(RSC + Client Components)"]
        API["API Routes<br/>(/api/*)"]
        MW --> RSC
        MW --> API
    end

    subgraph Supabase["Supabase"]
        Auth["Auth<br/>(JWT / cookies)"]
        Storage["Storage<br/>(avatars bucket)"]
        PG["PostgreSQL<br/>(pooled + direct)"]
    end

    UI --> RSC
    UI --> API
    ZS --> UI
    API --> Auth
    API --> Storage
    API --> PG
    RSC --> Auth
```

**Request path (authenticated API call):**

```mermaid
sequenceDiagram
    participant B as Browser
    participant M as Middleware
    participant A as API Route
    participant S as Supabase Auth
    participant P as Prisma / PostgreSQL

    B->>M: GET /api/definitions?workspaceId=…
    M->>S: getUser() from cookies
    alt No session
        M-->>B: 401 Unauthorized
    else Valid session
        M->>A: Forward request
        A->>S: requireSessionUser()
        A->>P: requireWorkspaceMember()
        A->>P: prisma.definition.findMany()
        P-->>A: rows
        A-->>B: { data, error, meta }
    end
```

---

## Application layers

```mermaid
flowchart LR
    subgraph Presentation
        Pages["app/app/* pages"]
        Components["components/*"]
        Layouts["layouts + AppShell"]
    end

    subgraph ClientLogic
        Hooks["hooks/"]
        Stores["stores/"]
        RQ["TanStack Query cache"]
    end

    subgraph ServerLogic
        Routes["app/api/*"]
        Lib["lib/ (permissions, compiler, versioning)"]
        Validators["validators (Zod)"]
    end

    subgraph Data
        Prisma["Prisma Client"]
        DB[(PostgreSQL)]
    end

    Pages --> Components
    Components --> Hooks
    Components --> Stores
    Components --> RQ
    RQ --> Routes
    Routes --> Lib
    Routes --> Validators
    Lib --> Prisma
    Prisma --> DB
```

### Key client stores

| Store | Purpose |
|-------|---------|
| `useWorkspaceStore` | Current workspace / organization context |
| `useAppearanceStore` | Theme preset, font, language (persisted) |
| `useActionOverlay` | Global loading overlay for long-running mutations |

### Key server modules

| Module | Purpose |
|--------|---------|
| `lib/api.ts` | Standard API response shape, auth helpers, workspace membership checks |
| `lib/permissions.ts` | Role-based edit / approve / delete gates |
| `lib/versioning.ts` | Immutable snapshot creation on publish |
| `lib/compiler/` | Pseudocode generation (generic, SQL, Python, dbt) |
| `lib/definitions.ts` | Snapshot builder and Prisma include shapes |

---

## Data model

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : "belongs to"
    Workspace ||--o{ WorkspaceMember : "has"
    Workspace ||--o{ DefinitionGroup : "organizes"
    Workspace ||--o{ Definition : "contains"

    DefinitionGroup ||--o{ Definition : "groups"
    Definition ||--o{ Condition : "has"
    Definition ||--o{ DefinitionVersion : "versioned by"
    Definition ||--o{ DefinitionOwner : "owned by"
    Definition ||--o{ ChangeRequest : "change requests"
    Definition ||--o{ Comment : "discussions"

    User ||--o{ DefinitionOwner : "co-owner"
    User ||--o{ DefinitionVersion : "changed by"
    User ||--o{ ChangeRequest : "requests / reviews"
    User ||--o{ Comment : "authors"

    Definition {
        string id PK
        string name
        enum type "METRIC|RULE|FILTER|FLAG"
        enum status "DRAFT|PUBLISHED|DEPRECATED|PENDING_REVIEW"
        int currentVersion
        string sourceTable
        enum aggregationFn
    }

    DefinitionVersion {
        string id PK
        int version
        json snapshot
        string changeDescription
    }

    Condition {
        int order
        enum connector "IF|AND|OR"
        enum operator
        string field
        string value
    }
```

---

## Authentication flow

Supabase handles identity; LogicGate syncs the Supabase user into the local `User` table on first login.

```mermaid
flowchart TD
    A[User visits /login] --> B[Supabase email/password or OAuth]
    B --> C{Session cookie set?}
    C -->|No| A
    C -->|Yes| D[POST /api/auth/sync]
    D --> E[Upsert User + WorkspaceMember in PostgreSQL]
    E --> F[Redirect to /app]
    F --> G[Middleware validates session on every request]
    G --> H{Path protected?}
    H -->|/app/*| I[Allow or redirect to /login]
    H -->|/api/*| J[401 JSON or proceed]
```

Public routes: `/`, `/login`, `/signup`, `/invite/[token]`.

---

## Definition lifecycle

Draft edits autosave to the working definition **without** creating versions. Publishing is the only action that writes to version history.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create definition
    DRAFT --> DRAFT: Autosave fields / conditions / ownership
    DRAFT --> PENDING_REVIEW: Stakeholder submits change request
    PENDING_REVIEW --> DRAFT: Rejected
    PENDING_REVIEW --> PUBLISHED: Approved + published
    DRAFT --> PUBLISHED: Engineer publishes (with message)
    PUBLISHED --> PUBLISHED: Edit draft + publish again (new version)
    PUBLISHED --> DEPRECATED: Soft delete
    DEPRECATED --> [*]
```

**Publish flow (creates version snapshot):**

```mermaid
sequenceDiagram
    participant U as User
    participant UI as PublishDialog
    participant API as POST /api/definitions/:id/publish
    participant V as createVersionSnapshot()
    participant DB as PostgreSQL

    U->>UI: Click Publish + enter message
    UI->>API: { message: "Added trial exclusion" }
    API->>DB: Update status → PUBLISHED
    API->>V: Build JSON snapshot (definition + conditions + owners)
    V->>DB: Increment currentVersion, insert DefinitionVersion
    API-->>UI: Updated definition
    UI-->>U: Toast + refresh version list
```

**Compare / restore:** Any two versions can be diffed client-side via snapshot JSON. Restore replays a snapshot into the live definition and optionally records a new version.

---

## Pseudocode compiler

The compiler (`src/lib/compiler/`) transforms a definition + conditions into executable-style pseudocode.

```mermaid
flowchart LR
    D[Definition record] --> B[buildSnapshot]
    C[Conditions] --> B
    B --> I[CompilerInput]
    I --> G[compileGeneric]
    I --> S[compileSQL]
    I --> P[compilePython]
    I --> T[compileDbt]
    G & S & P & T --> O[Formatted code string]
    O --> UI[PseudocodeSidebar / Export]
```

Supported operators: `EQUALS`, `NOT_EQUALS`, `IN`, `NOT_IN`, comparisons, `IS_NULL`, `CONTAINS`, `STARTS_WITH`, etc.

---

## API overview

All API routes return `{ data, error, meta }`.

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/auth/me` | Current user profile |
| `POST` | `/api/auth/sync` | Sync Supabase user to DB |
| `GET/POST` | `/api/workspaces` | List / create workspaces |
| `PATCH` | `/api/workspaces/[id]` | Update workspace settings |
| `POST` | `/api/workspaces/logo` | Upload organization logo |
| `GET/POST` | `/api/definitions` | List / create definitions |
| `GET/PATCH/DELETE` | `/api/definitions/[id]` | Read / update / deprecate |
| `POST` | `/api/definitions/[id]/publish` | Publish + version snapshot |
| `PUT` | `/api/definitions/[id]/conditions` | Replace condition rows |
| `PUT` | `/api/definitions/[id]/owners` | Set owners + approver |
| `GET` | `/api/definitions/[id]/versions` | Version list (no snapshot payload) |
| `GET` | `/api/definitions/[id]/versions/[v]` | Single version + snapshot |
| `POST` | `/api/definitions/[id]/versions/[v]/restore` | Restore from snapshot |
| `GET` | `/api/definitions/[id]/pseudocode?format=` | Compile pseudocode |
| `GET/POST` | `/api/definitions/[id]/comments` | Discussion threads |
| `GET/POST` | `/api/change-requests` | Change request workflow |
| `GET/PATCH` | `/api/users/me` | Profile settings |

---

## Project structure

```
logicgate/
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   ├── db-push.mjs            # Direct-connection schema push (Supabase)
│   ├── setup-db.mjs           # Full DB bootstrap
│   └── apply-rls.mjs          # Row-level security policies
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, signup
│   │   ├── api/               # REST API routes
│   │   └── app/               # Authenticated application shell
│   │       ├── definitions/   # Three-panel definition editor
│   │       ├── history/       # Workspace version feed
│   │       ├── export/        # Bulk pseudocode ZIP export
│   │       └── settings/      # Workspace + integrations
│   ├── components/
│   │   ├── definitions/       # VisualBuilder, Changelog, Compare, etc.
│   │   ├── layout/            # AppShell, Sidebar, OrganizationRail
│   │   └── providers/         # Query, Appearance providers
│   ├── lib/
│   │   ├── compiler/          # Pseudocode compilers
│   │   ├── supabase/          # SSR client, middleware helpers
│   │   ├── api.ts             # Auth + response utilities
│   │   ├── permissions.ts     # RBAC helpers
│   │   └── versioning.ts      # Snapshot creation
│   └── stores/                # Zustand client stores
├── tests/e2e/                 # Playwright end-to-end tests
├── docs/                      # Setup and deployment guides
├── middleware.ts              # Auth gate for /app and /api
└── vercel.json                # Deployment config
```

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- A **Supabase** project (PostgreSQL + Auth + Storage)
- Git

### 1. Clone and install

```bash
git clone https://github.com/azzammasood/logicgate.git
cd logicgate
npm install
```

### 2. Configure environment

Copy the example below into `.env.local` (never commit this file):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Prisma — use pooler (6543) for runtime, direct (5432) for migrations
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-region.pooler.supabase.com:5432/postgres
```

See [`docs/SETUP_LOGICGATE.md`](docs/SETUP_LOGICGATE.md) for Supabase-specific setup (RLS, storage bucket, auth URLs).

### 3. Initialize the database

```bash
npm run db:push      # Push schema (uses DIRECT_URL)
npm run db:rls       # Apply row-level security
npm run test:db      # Smoke test
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `npm run dev` runs `prisma generate` automatically so the client stays in sync with the schema.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (browser + middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin operations |
| `DATABASE_URL` | Yes | Pooled Postgres connection (port 6543) |
| `DIRECT_URL` | Yes | Direct Postgres connection for migrations (port 5432) |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Prisma generate + Next.js) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |
| `npm run db:push` | Push Prisma schema via direct connection |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:qa` | Full QA spec (single worker) |

---

## Testing

```bash
# Unit tests
npm run test

# End-to-end (requires running dev server + seeded DB)
npm run test:e2e

# Full QA checklist automation
npm run test:qa
```

See [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) for manual QA steps.

---

## Deployment

LogicGate is configured for [Vercel](https://vercel.com). Set all environment variables in the Vercel project dashboard.

```bash
npm run build   # verify locally first
```

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for production deployment notes.

**Supabase Auth redirect URLs:** add your production domain (e.g. `https://your-app.vercel.app/**`).

---

## UI layout (definitions editor)

```mermaid
flowchart TB
    subgraph DefinitionsPage["/app/definitions/[id]"]
        TB[DefinitionsTopBar<br/>Breadcrumbs · Publish · Compare]
        subgraph Panels["Three-panel layout"]
            LP[DefinitionsListPanel<br/>Search · Active/Deprecated filter]
            MP[Main panel<br/>Visual Builder · Changelog · Discuss · Settings]
            RP[PseudocodeSidebar<br/>Format tabs · Version history]
        end
        TB --> Panels
    end
```

Each panel scrolls independently (`min-h-0` + `overflow-y-auto` flex layout).

---

## Permissions model

```mermaid
flowchart TD
    U[User] --> WR[WorkspaceRole]
    WR --> O[OWNER]
    WR --> E[EDITOR]
    WR --> V[VIEWER]

    O --> CE[Can edit all definitions]
    O --> CT[Can manage team]
    E --> CE
    V --> RO[Read-only]

    U --> UR[UserRole: ENGINEER / STAKEHOLDER]
    UR --> CD[Can create definitions]
    UR --> CR[Can submit change requests]
```

Definition-level checks also consider whether the user is an owner or assigned approver (`lib/permissions.ts`).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit with clear messages
4. Run `npm run type-check && npm run lint && npm run test`
5. Open a pull request

---

## License

Private / all rights reserved unless otherwise specified by the repository owner.

---

## Related documentation

- [`docs/FIRST_RUN.md`](docs/FIRST_RUN.md) — Quick start for engineers and stakeholders
- [`docs/SETUP_LOGICGATE.md`](docs/SETUP_LOGICGATE.md) — Supabase project setup
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — Production deployment
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — Manual QA checklist
