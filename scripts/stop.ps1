# =============================================================================
# PLANEJA+ — SCRIPT DE PARADA CONTROLADA DOS SERVIÇOS
# =============================================================================

Write-Host "=== Encerrando containers do Planeja+ (volumes de dados preservados) ===" -ForegroundColor Cyan
docker compose down
Write-Host "[OK] Serviços encerrados com segurança." -ForegroundColor Green
