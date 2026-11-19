# =============================================================================
# PLANEJA+ — SCRIPT AUTOMATIZADO DE BACKUP (BANCO POSTGRESQL + ARQUIVOS)
# =============================================================================

param(
    [string]$OutputDir = "database/backups"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$SqlBackupFile = Join-Path $OutputDir "planeja_plus_$Timestamp.sql"

Write-Host "=== Planeja+ | Exportando Backup do Banco planeja_plus ===" -ForegroundColor Cyan

$pgContainer = docker ps -q -f name=planeja-postgres 2>$null
if ($pgContainer) {
    Write-Host "[PG_DUMP] Exportando via container oficial PostgreSQL 16..." -ForegroundColor Green
    docker exec planeja-postgres pg_dump -U planeja -d planeja_plus --clean --if-exists > $SqlBackupFile
} else {
    Write-Host "[NODE_PG] Exportando via motor PostgreSQL 16 local..." -ForegroundColor Green
    node scripts/db-backup-restore.mjs backup --out=$SqlBackupFile
}

if (Test-Path "storage/uploads") {
    $ZipFile = Join-Path $OutputDir "planeja_plus_uploads_$Timestamp.zip"
    Compress-Archive -Path "storage/uploads/*" -DestinationPath $ZipFile -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Arquivos enviados compactados em: $ZipFile" -ForegroundColor Green
}

Write-Host "[OK] Backup SQL salvo em: $SqlBackupFile" -ForegroundColor Green
