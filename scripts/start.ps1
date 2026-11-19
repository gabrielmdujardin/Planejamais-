# =============================================================================
# PLANEJA+ — SCRIPT DE INICIALIZAÇÃO (DOCKER COMPOSE OU MODO LOCAL)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=== Iniciando Infraestrutura Planeja+ (PostgreSQL 16 + Mailpit + App) ===" -ForegroundColor Cyan

$dockerReady = $false
try {
    docker info | Out-Null
    $dockerReady = $true
} catch {
    $dockerReady = $false
}

if ($dockerReady) {
    Write-Host "[DOCKER] Subindo containers (postgres, mailpit, app)..." -ForegroundColor Green
    docker compose up -d --build
    Write-Host "[OK] Aplicação disponível em http://localhost:3000" -ForegroundColor Green
    Write-Host "[OK] Mailpit Web UI disponível em http://localhost:8025" -ForegroundColor Green
} else {
    Write-Host "[LOCAL] Docker Daemon não está em execução. Iniciando aplicação com PostgreSQL 16 embarcado persistente..." -ForegroundColor Yellow
    npm run dev
}
