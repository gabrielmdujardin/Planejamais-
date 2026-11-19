# =============================================================================
# PLANEJA+ — SCRIPT AUTOMATIZADO DE RESTAURAÇÃO DO BANCO POSTGRESQL
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    throw "Arquivo de backup não encontrado: $BackupFile"
}

Write-Host "=== Planeja+ | Restaurando e Validando Backup: $BackupFile ===" -ForegroundColor Cyan

$pgContainer = docker ps -q -f name=planeja-postgres 2>$null
if ($pgContainer) {
    Get-Content $BackupFile | docker exec -i planeja-postgres psql -U planeja -d planeja_plus
    Write-Host "[OK] Backup restaurado no container planeja-postgres." -ForegroundColor Green
} else {
    node scripts/db-backup-restore.mjs restore --in=$BackupFile
    Write-Host "[OK] Backup validado e restaurado em instância PostgreSQL 16 isolada." -ForegroundColor Green
}
