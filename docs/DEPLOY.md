# Deploy LogicGate to Vercel

1. Create a Supabase project and copy API keys and database URLs.
2. Set `DATABASE_URL` (pooler port 6543) and `DIRECT_URL` (port 5432).
3. Run `npx prisma db push` locally against your database.
4. Run SQL from `src/lib/supabase/rls.sql` in the Supabase SQL editor.
5. Push to GitHub and import the repo in Vercel.
6. Add all env vars from `.env.example`.
7. Deploy. Visit `/signup` to create the first user and workspace.
