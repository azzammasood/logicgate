# LogicGate — Supabase setup

**Product name:** LogicGate (everywhere in this repo)

**Supabase project:** LogicGate — ref `fkbxuvrlxyadehjcoxhn`  
**Dashboard:** https://supabase.com/dashboard/project/fkbxuvrlxyadehjcoxhn  
**API URL:** `https://fkbxuvrlxyadehjcoxhn.supabase.co`

**Pooler (required):** `aws-1-ap-south-1.pooler.supabase.com` — copy from Dashboard if this changes.

## Database setup (completed via CLI)

```powershell
npm run db:push      # use Session mode URL (port 5432) in DIRECT_URL
npm run db:rls       # applies src/lib/supabase/rls.sql
npm run test:supabase
npm run test:db      # Prisma create/delete smoke test
```

**Profile photos:** In Supabase → Storage, create a public bucket named `avatars`, then run `prisma/storage-avatars.sql` in the SQL editor.

## Run app & tests

```powershell
npm run dev
npm run test
npm run test:e2e
```

Auth URL config: Site URL `http://localhost:3000`, Redirect `http://localhost:3000/**`
