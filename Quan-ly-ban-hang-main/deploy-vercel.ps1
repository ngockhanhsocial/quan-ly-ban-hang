# Deploy Quan Ly Ban Hang len Vercel
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Build kiem tra truoc khi deploy ===" -ForegroundColor Cyan
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  pnpm run build:vercel
} else {
  npx pnpm run build:vercel
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "Build that bai! Sua loi roi chay lai." -ForegroundColor Red
  exit 1
}

Write-Host "`n=== Deploy len Vercel ===" -ForegroundColor Green
Write-Host "Lan dau se hoi dang nhap Vercel (mo trinh duyet)." -ForegroundColor Yellow
npx vercel --prod
