# LogicGate deploy: commit (if needed) -> push -> Vercel production.
# Usage:  ./deploy.ps1 "optional commit message"
#         ./deploy.ps1            (uses a timestamp message)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$msg = if ($args.Count -gt 0) { $args -join " " } else { "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }

# 1. Type-check (fast; catches errors before a wasted deploy). Comment out to skip.
Write-Host "Type-checking..." -ForegroundColor Cyan
npm run type-check
if ($LASTEXITCODE -ne 0) { Write-Host "Type-check failed - aborting." -ForegroundColor Red; exit 1 }

# 2. Commit any changes (skips cleanly if the tree is clean).
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "$msg`n`nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
} else {
  Write-Host "No changes to commit." -ForegroundColor Yellow
}

# 3. Push.
git push origin main

# 4. Deploy to production. If the CLI is logged out, log in once then retry.
Write-Host "Deploying to production..." -ForegroundColor Cyan
npx vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
  Write-Host "Deploy failed (often an expired login). Running 'vercel login', then retrying..." -ForegroundColor Yellow
  npx vercel login
  npx vercel --prod --yes
}

Write-Host "`nDone -> https://logicgate.space" -ForegroundColor Green
