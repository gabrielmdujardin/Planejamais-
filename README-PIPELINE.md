# Planeja+ Pipeline de Jobs

## Visão Geral

Este documento descreve a pipeline completa de jobs agendados do Planeja+, incluindo consolidação de dados, monitoramento e integrações.

## Arquitetura

### Componentes Principais

1. **Job Queue**: Sistema de fila em memória para controlar execuções
2. **Job Runner**: Base class para execução padronizada de jobs
3. **Jobs Específicos**: Implementações para cada tipo de tarefa
4. **Monitor Dashboard**: Interface web para acompanhamento em tempo real
5. **API Routes**: Endpoints seguros para execução de jobs

### Fluxo de Dados

\`\`\`
Vercel Cron → API Route → Job Runner → Supabase → Dashboard Monitor
\`\`\`

## Jobs Implementados

### 1. Daily Aggregate (`daily-aggregate`)
- **Frequência**: Diariamente às 02:00
- **Função**: Atualiza materialized views e consolida dados
- **Tabelas afetadas**: `mv_event_costs`, `mv_rsvp_stats`, `facts_daily_events`

### 2. Pending Invites (`pending-invites`)
- **Frequência**: Duas vezes ao dia (09:00 e 15:00)
- **Função**: Envia lembretes para convidados pendentes
- **Integrações**: Email/WhatsApp (simulado)

### 3. Calendar Sync (`calendar-sync`)
- **Frequência**: Diariamente às 01:00
- **Função**: Gera feeds ICS para integração com calendários externos
- **Endpoint público**: `/api/ics/[userId].ics`

### 4. Cleanup (`cleanup`)
- **Frequência**: Semanalmente aos domingos às 03:00
- **Função**: Remove dados antigos e otimiza performance
- **Retenção**: 30 dias para logs, 1 ano para eventos

## Estrutura do Banco de Dados

### Tabelas de Pipeline

\`\`\`sql
-- Execuções de jobs
job_runs (id, job_name, status, started_at, completed_at, duration_ms, error_message, metadata)

-- Logs detalhados
job_logs (id, job_run_id, level, message, metadata, created_at)

-- Staging (dados temporários)
stg_event_costs (event_id, total_cost, items_count, processed_at)
stg_rsvp_stats (event_id, confirmed_count, pending_count, declined_count, processed_at)

-- Fatos consolidados
facts_daily_events (date, total_events, total_guests, total_cost)
\`\`\`

### Materialized Views

\`\`\`sql
-- Custos por evento
mv_event_costs (id, title, date, total_cost, items_count)

-- Estatísticas de RSVP
mv_rsvp_stats (id, title, date, confirmed_count, pending_count, declined_count, total_guests)
\`\`\`

## Segurança

### Autenticação
- **Header secreto**: `Authorization: Bearer ${JOBS_SECRET_TOKEN}`
- **Service Role Key**: Para acesso direto ao Supabase
- **Row Level Security**: Habilitado em todas as tabelas

### Rate Limiting
- Controle de execuções simultâneas via job queue
- Prevenção de execução duplicada do mesmo job

### Tokens Opacos
- Links públicos de RSVP com tokens únicos
- Feeds ICS protegidos por user ID

## Monitoramento

### Dashboard (`/dashboard/monitor`)
- **Estatísticas em tempo real**: Total, concluídos, falharam, executando
- **Lista de execuções**: Status, duração, logs detalhados
- **Execução manual**: Para testes e correções
- **Atualizações automáticas**: Via Supabase Realtime

### Alertas
- Webhook para notificar falhas (Slack/Email)
- Logs estruturados para debugging
- Métricas de performance

## Variáveis de Ambiente

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Jobs
JOBS_SECRET_TOKEN=your_secret_token

# Integrações (opcional)
INVITES_PROVIDER_KEY=your_provider_key
WEBHOOK_SLACK_URL=your_slack_webhook
\`\`\`

## Deployment

### Vercel Configuration
1. Configure as variáveis de ambiente no dashboard da Vercel
2. O arquivo `vercel.json` já está configurado com os crons
3. Deploy automático ativará os jobs agendados

### Supabase Setup
1. Execute o script `scripts/create-pipeline-tables.sql`
2. Configure as políticas RLS conforme necessário
3. Ative o Realtime para a tabela `job_runs`

## Uso

### Execução Manual
\`\`\`bash
# Via API
curl -X POST https://your-app.vercel.app/api/jobs/daily-aggregate \
  -H "Authorization: Bearer your_secret_token"

# Via Dashboard
Acesse /dashboard/monitor → Aba "Execução Manual"
\`\`\`

### Monitoramento
\`\`\`bash
# Acessar dashboard
https://your-app.vercel.app/dashboard/monitor

# Ver logs específicos
Clique no ícone de olho ao lado de cada job
\`\`\`

## Troubleshooting

### Job Falhou
1. Verifique os logs no dashboard monitor
2. Confirme as variáveis de ambiente
3. Execute manualmente para debug

### Performance Lenta
1. Verifique índices nas tabelas
2. Analise logs de duração
3. Considere otimizar queries

### Dados Inconsistentes
1. Execute job de cleanup
2. Refresh manual das materialized views
3. Verifique integridade dos dados

## Próximos Passos

- [ ] Implementar webhooks de alerta
- [ ] Adicionar métricas de negócio
- [ ] Integração real com provedores de email/SMS
- [ ] Dashboard de analytics avançado
- [ ] Backup automático de dados críticos
