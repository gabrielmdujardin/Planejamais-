# =============================================================================
# PLANEJA+ — SCRIPT DE SETUP INICIAL (WINDOWS POWERSHELL)
# Prepara variáveis de ambiente, diretórios persistentes e valida dependências.
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=== Planeja+ | Configuração da Infraestrutura Própria PostgreSQL ===" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Arquivo .env criado a partir de .env.example" -ForegroundColor Green
} else {
    Write-Host "[INFO] Arquivo .env já existe e foi preservado." -ForegroundColor Yellow
}

New-Item -ItemType Directory -Force -Path "storage/uploads/event-photos" | Out-Null
New-Item -ItemType Directory -Force -Path "storage/uploads/avatars" | Out-Null
New-Item -ItemType Directory -Force -Path "storage/uploads/documents" | Out-Null
New-Item -ItemType Directory -Force -Path "database/backups" | Out-Null
Write-Host "[OK] Diretórios persistentes de armazenamento e backup verificados." -ForegroundColor Green

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Docker CLI detectado: $(docker --version)" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Docker CLI não encontrado no PATH. O motor PostgreSQL 16 local embarcado será utilizado." -ForegroundColor Yellow
}

Write-Host "Setup concluído! Execute .\scripts\start.ps1 ou 'docker compose up -d --build'." -ForegroundColor Cyan
