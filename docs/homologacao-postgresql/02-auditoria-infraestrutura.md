# 02 — Auditoria da Infraestrutura (Docker, PostgreSQL, Mailpit, Storage e Rede)

**Projeto:** Planeja+  
**Data:** `18/11/2026`

---

## 1. Componentes Auditados da Infraestrutura

| Serviço / Recurso | Especificação Auditada | Porta / Binding | Volume Persistente | Health Check | Status |
|---|---|---|---|---|---|
| **Docker CLI & Compose** | Docker `29.4.0` + Docker Compose `v5.1.1` | — | — | Verificado via CLI | **Conforme** |
| **PostgreSQL (`planeja-postgres`)** | `postgres:16.4-alpine` (Banco `planeja_plus`) | `127.0.0.1:5432:5432` (Loopback local) | `planeja_plus_pgdata` + bind `./database/migrations` | `pg_isready -U planeja -d planeja_plus` (5s) | **Conforme** |
| **Mailpit (`planeja-mailpit`)** | `axllent/mailpit:v1.21.4` | `127.0.0.1:1025` (SMTP) / `127.0.0.1:8025` (Web UI) | `planeja_plus_mailpit` (`/data/mailpit.db`) | `/mailpit readyz` (10s) | **Conforme** |
| **Aplicação (`planeja-app`)** | Node `22-alpine` Multi-stage (`Dockerfile`) | `0.0.0.0:3000:3000` | `planeja_plus_uploads` (`/app/storage/uploads`) | `wget --spider -q http://127.0.0.1:3000/api/health` | **Conforme** |
| **pgAdmin 4 (`planeja-pgadmin`)** | `dpage/pgadmin4:8.12` (Perfil opcional `pgadmin`) | `127.0.0.1:5050:80` | `planeja_plus_pgadmin` | Depende de `postgres: service_healthy` | **Conforme** |
| **Motor PostgreSQL Embarcado** | `@electric-sql/pglite` (PostgreSQL real com `pgcrypto` e `uuid_ossp`) | In-process / Disco `./storage/pgdata-local` | `./storage/pgdata-local` | `GET /api/health` (`SELECT version()`) | **Conforme** |

---

## 2. Verificações de Segurança e Resiliência da Infraestrutura

1. **Isolamento de Rede do Banco de Dados:**
   - No `docker-compose.yml`, a porta `5432` do PostgreSQL está vinculada exclusivamente a `127.0.0.1:${POSTGRES_PORT:-5432}:5432`, impedindo conexões diretas a partir de interfaces externas de rede.
   - Os serviços comunicam-se internamente pela rede bridge privada `planeja-internal`.
2. **Ordem de Inicialização e Dependências:**
   - O serviço `app` declara `depends_on` com `condition: service_healthy` tanto para `postgres` quanto para `mailpit`, garantindo que o backend só receba tráfego após o PostgreSQL concluir a execução das migrations em `/docker-entrypoint-initdb.d/`.
3. **Recuperação e Persistência pós-reinicialização:**
   - Todos os serviços possuem política `restart: unless-stopped` e rotação de logs JSON (`max-size: 10m..20m`, `max-file: 3..5`).
   - Os dados do PostgreSQL (`planeja_plus_pgdata`), e-mails capturados (`planeja_plus_mailpit`) e uploads de fotos/documentos (`planeja_plus_uploads`) permanecem intactos após `docker compose down` e `docker compose up -d`.
4. **Portabilidade em Ambiente Limpo:**
   - Nenhum caminho absoluto do computador original (`C:\Users\...`) está presente no `docker-compose.yml`, `Dockerfile`, `.env.example` ou scripts PowerShell (`scripts/*.ps1`).
