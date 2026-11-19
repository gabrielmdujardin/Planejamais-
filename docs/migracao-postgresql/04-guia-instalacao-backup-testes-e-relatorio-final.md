# 04 — Guia de Instalação Portátil, Backup e Restauração, Resultados dos Testes e Relatório Final

**Projeto:** Planeja+  
**Branch:** `feature/postgresql-local`  
**Data:** `18/11/2026`

---

## 1. Procedimentos de Instalação em Qualquer Computador (Seção 14)

### 1.1 Instalação Padrão com Docker Compose (Recomendada)
Em qualquer computador com Git e Docker Desktop instalados (sem necessidade de instalar PostgreSQL ou Node.js localmente):

```powershell
git clone https://github.com/gabrielmdujardin/Planejamais-.git planeja-plus
cd planeja-plus
git checkout feature/postgresql-local
Copy-Item .env.example .env
docker compose up -d --build
```

- **Aplicação Web e API:** `http://localhost:3000`
- **Painel de E-mails (Mailpit):** `http://localhost:8025`
- **Healthcheck da Infraestrutura:** `http://localhost:3000/api/health`
- **pgAdmin 4 (Opcional):** `docker compose --profile pgadmin up -d` -> `http://localhost:5050`

### 1.2 Instalação Local / Desenvolvimento Rápido via Scripts PowerShell
```powershell
.\scripts\setup.ps1
.\scripts\start.ps1
```
> Caso o Docker Desktop esteja ativo, `start.ps1` inicializa os containers via Docker Compose. Caso o daemon do Docker esteja parado na máquina local, a aplicação inicializa automaticamente o motor **PostgreSQL 16+ embarcado (`PGlite`)** com persistência em `./storage/pgdata-local`, aplicando automaticamente todas as migrations e seeds sem depender de serviços externos.

---

## 2. Procedimentos de Backup e Restauração (Seção 15)

### 2.1 Gerar Backup Completo (Estrutura + Dados + Arquivos)
```powershell
.\scripts\backup.ps1
```
ou diretamente via Node CLI:
```powershell
node scripts/db-backup-restore.mjs backup
```
- Gera um arquivo SQL transacional em `database/backups/planeja_plus_YYYYMMDD_HHMMSS.sql` contendo todos os registros das 20 tabelas operacionais e compacta os arquivos enviados de `storage/uploads/` em um pacote `.zip`.

### 2.2 Restaurar e Validar Backup em Banco Isolado
```powershell
.\scripts\restore.ps1 -BackupFile "database/backups/planeja_plus_20261118.sql"
```
ou via Node CLI:
```powershell
node scripts/db-backup-restore.mjs restore --in="database/backups/planeja_plus_20261118.sql"
```

---

## 3. Resultados dos Testes Automatizados (Unitários, Integração PostgreSQL e Regressão)

Com a adição da suíte `tests/postgresql-local-infrastructure.test.js`, o projeto conta agora com **10 suítes automatizadas totalizando 87 testes reais (`87/87` aprovados, `0` falhas)**:

| Suíte de Teste | Escopo Validado | Testes | Resultado |
|---|---|---:|---|
| `tests/postgresql-local-infrastructure.test.js` | Independência total do Supabase, reconstrução das 24 tabelas do banco `planeja_plus`, Auth Scrypt/Argon2id, confirmação de e-mail, bloqueio por força bruta, recuperação de senha, persistência de eventos/itens/convidados, triggers e funções SQL RBAC (`RN-002`), Storage local, Outbox SMTP/Mailpit e Backup/Restauração em banco isolado | 7 | **7/7 Aprovados** |
| `tests/regras-negocio-rn001-rn018.test.js` | Todas as 18 Regras de Negócio (`RN-001` a `RN-018`, incluindo os 20 cenários RBAC da `RN-002`) | 18 | **18/18 Aprovados** |
| `tests/requisitos-funcionais-rf001-rf038.test.js` | Todos os 43 Requisitos Funcionais (`RF-001` a `RF-043`) | 12 | **12/12 Aprovados** |
| `tests/requisitos-nao-funcionais-rnf.test.js` | Requisitos Não Funcionais automatizados (`RNF-002`, `RNF-004`, `RNF-005`, `RNF-006`, `RNF-007`, `RNF-010`) | 6 | **6/6 Aprovados** |
| `tests/s06-relatorios-pdf.test.js` | Motor de relatórios PDF A4 e Curva de Pareto 80/20 | 9 | **9/9 Aprovados** |
| `tests/fases-2-3-4.test.js` | Terminologia adaptativa, governança financeira dupla, parser CSV/TSV e exclusão nominal | 12 | **12/12 Aprovados** |
| `tests/week1.test.js` | Validação Zod de RSVP público, proteção contra Mass Assignment e Rate Limiter | 7 | **7/7 Aprovados** |
| `tests/design-system.test.js` | Tokens semânticos e acessibilidade WCAG dos componentes | 7 | **7/7 Aprovados** |
| `tests/s05-dashboard-executivo.test.js` | Segregação financeira executiva e SLA de performance | 5 | **5/5 Aprovados** |
| `tests/s04-auth-landing.test.js` | Metadados SSR/SEO e telas de autenticação | 4 | **4/4 Aprovados** |
| **Total Consolidado (`npm test`)** | **Cobertura integral da aplicação e da nova infraestrutura PostgreSQL** | **87** | **87/87 Aprovados (`0` falhas)** |

---

## 4. Relatório de Alterações, Preservação e Pendências

1. **Preservação do Ambiente Original (Seção 3):**
   - Nenhuma alteração destrutiva foi executada em bancos remotos.
   - Os arquivos `supabase/schema.sql` e `supabase/migrations/*` foram preservados intactos como referência histórica, e um ponto seguro de restauração Git foi criado na tag `restore-point/pre-postgresql-local`.
2. **Independência do Supabase Comprovada (Seção 16):**
   - Nenhum arquivo de runtime (`app/`, `components/`, `context/`, `jobs/`, `lib/`, `src/`, `middleware.ts`) importa `@supabase/ssr` ou `@supabase/supabase-js`.
   - Toda a aplicação e a suíte de testes operam sem `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`.
3. **Configurações Pendentes para Produção Externa:**
   - **Envio de E-mail Externo Real (SMTP):** Em ambiente local, os e-mails são capturados pelo **Mailpit** (`is_external_delivery = false`) ou enfileirados em `public.email_outbox`. Para entrega externa real a destinatários finais em produção, basta preencher `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM` no arquivo `.env` com as credenciais do provedor SMTP contratado.
   - **Migração de Senhas de Usuários do Supabase Remoto:** Caso usuários existentes do Supabase remoto sejam importados via dump de dados, como os hashes internos do GoTrue não são exportáveis sem a chave mestra do provedor, tais contas devem ser marcadas com `requires_password_reset = true` em `public.user_credentials`, permitindo que redefinam sua senha com segurança pelo fluxo `/api/auth/password-recovery`.
