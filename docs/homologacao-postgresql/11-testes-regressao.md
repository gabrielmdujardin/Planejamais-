# 11 — Testes de Regressão Completa

**Projeto:** Planeja+  
**Data:** `18/11/2026`  
**Comando de Execução:** `npx tsc --noEmit ; npm test`

---

## 1. Resultado Consolidado das 11 Suítes de Testes Automatizados (`92` Testes)

| # | Arquivo da Suíte de Teste | Escopo Verificado | Testes Executados | Aprovados | Reprovados |
|---:|---|---|---:|---:|---:|
| 1 | `tests/homologacao-postgresql-jornadas.test.js` | 5 Jornadas Integradas (A, B, C, D e E) nas 9 camadas, Rollback transacional, Concorrência, SQL Injection, `EXPLAIN ANALYZE` e validação dos 71 requisitos | 5 | **5** | 0 |
| 2 | `tests/postgresql-local-infrastructure.test.js` | Independência total do Supabase, reconstrução das 24 tabelas do banco `planeja_plus`, Auth Scrypt/Argon2id, Storage local, Outbox SMTP/Mailpit e Backup/Restauração em banco isolado | 7 | **7** | 0 |
| 3 | `tests/regras-negocio-rn001-rn018.test.js` | Cobertura 1:1 das 18 Regras de Negócio (`RN-001` a `RN-018`, incluindo os 20 cenários RBAC da `RN-002`) | 18 | **18** | 0 |
| 4 | `tests/requisitos-funcionais-rf001-rf038.test.js` | Todos os 43 Requisitos Funcionais (`RF-001` a `RF-043`) | 12 | **12** | 0 |
| 5 | `tests/requisitos-nao-funcionais-rnf.test.js` | Requisitos Não Funcionais automatizados (`RNF-002`, `RNF-004`, `RNF-005`, `RNF-006`, `RNF-007`, `RNF-010`) | 6 | **6** | 0 |
| 6 | `tests/s06-relatorios-pdf.test.js` | Motor de relatórios PDF A4, Curva de Pareto 80/20 e formatação PT-BR | 9 | **9** | 0 |
| 7 | `tests/fases-2-3-4.test.js` | Terminologia adaptativa, governança financeira dupla, parser CSV/TSV e exclusão nominal | 12 | **12** | 0 |
| 8 | `tests/week1.test.js` | Validação Zod de RSVP público, Mass Assignment Protection e Rate Limiter por IP | 7 | **7** | 0 |
| 9 | `tests/design-system.test.js` | Variantes, tokens semânticos e acessibilidade WCAG 2.1 dos componentes base | 7 | **7** | 0 |
| 10 | `tests/s05-dashboard-executivo.test.js` | Segregação financeira executiva e SLA de performance para 500 eventos | 5 | **5** | 0 |
| 11 | `tests/s04-auth-landing.test.js` | Metadados SSR/SEO da Landing Page e padrões de Login/Cadastro | 4 | **4** | 0 |
| — | **Total Geral (`npm test`)** | **Cobertura integral pós-migração para PostgreSQL** | **92** | **92** | **0** |
