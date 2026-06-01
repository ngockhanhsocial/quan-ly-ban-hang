# Chay ung dung Quan Ly Ban Hang (POS) tren Windows
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  $pnpmCmd = "npx pnpm"
} else {
  $pnpmCmd = "pnpm"
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Dang cai thu vien lan dau..." -ForegroundColor Cyan
  Invoke-Expression "$pnpmCmd install --ignore-scripts"
}

Write-Host "Khoi dong POS tai http://localhost:5173" -ForegroundColor Green
Invoke-Expression "$pnpmCmd --filter @workspace/pos-app run dev"
