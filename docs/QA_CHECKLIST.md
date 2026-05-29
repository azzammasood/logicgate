# LogicGate QA Checklist

## Automated QA (Playwright)

```powershell
$env:QA_EMAIL="your@email.com"
$env:QA_PASSWORD="your-password"
npm run test:qa
```

Requires `.env.local` with Supabase keys. Restart dev server after `prisma db push` (`npm run dev` runs `prisma generate` automatically).

## AUTH
- [ ] Signup creates user in both Supabase auth and Prisma User table
- [ ] Magic link login works
- [ ] Protected routes redirect to /login when unauthenticated
- [ ] Session persists on page refresh

## DEFINITIONS
- [ ] Create definition with all fields → saved correctly
- [ ] Auto-save fires 1.5s after last keystroke
- [ ] Version increments on every save
- [ ] Delete sets status=DEPRECATED

## PSEUDOCODE
- [ ] Generic, SQL, Python, dbt formats compile
- [ ] Copy button works

## CHANGE REQUESTS
- [ ] Stakeholder can submit change request
- [ ] Approving applies snapshot to definition

## ROLES
- [ ] VIEWER cannot edit
- [ ] STAKEHOLDER cannot create definitions (if restricted)
- [ ] Only ADMIN/OWNER can delete
