# 06 — Testes End-to-End (E2E) e Jornadas Integradas (Jornadas A, B, C, D e E)

**Projeto:** Planeja+  
**Executores:** [lib/validation-center/journeys.ts](file:///c:/Users/gabri/Projetos/planejamais/lib/validation-center/journeys.ts), [scripts/e2e-runner.js](file:///c:/Users/gabri/Projetos/planejamais/scripts/e2e-runner.js) e [tests/homologacao-postgresql-jornadas.test.js](file:///c:/Users/gabri/Projetos/planejamais/tests/homologacao-postgresql-jornadas.test.js)

---

## 1. Resultados das 5 Jornadas Integradas Obrigatórias (Seção 14)

| ID da Jornada | Perfil / Cenário | Etapas Executadas no PostgreSQL Real | Status |
|---|---|---|---|
| **JORNADA-A** | **Organizador Individual** | 1. Cadastro de conta (`Mariana Organizadora`), hash `$scrypt$`, confirmação de e-mail por token e login.<br>2. Criação do evento `Summit Tecnológico` com orçamento de `R$ 12.000,00`.<br>3. Adição de convidado titular confirmado + acompanhante aprovado (`2` participantes confirmados conforme `RN-005`).<br>4. Registro de 2 despesas (`R$ 6.500,00 + R$ 3.200,00 = R$ 9.700,00`, saldo `R$ 2.300,00`).<br>5. Upload real de foto no storage local e verificação de persistência pós-sessão. | **APROVADA** |
| **JORNADA-B** | **Empresa Organizadora de Eventos (Equipe RBAC `RN-002`)** | 1. Criação de 3 contas colaboradoras (`Carlos Administrador`, `Fernanda Financeiro`, `Gabriel Convidados`).<br>2. Vinculação ao evento em `public.event_members` com permissões distintas por módulo.<br>3. Validação no backend (`checkBackendEventPermission`): `Fernanda` edita `financial` (`ALLOWED`), mas é bloqueada em `guests` (`403 FORBIDDEN`); `Gabriel` edita `guests` (`ALLOWED`), mas é bloqueado em `financial` (`403 FORBIDDEN`); `Carlos (admin)` é bloqueado em `delete_event` (`403 FORBIDDEN`).<br>4. Revogação do acesso de `Fernanda` (`status = 'revoked'`) e confirmação de bloqueio imediato. | **APROVADA** |
| **JORNADA-C** | **Anfitrião ou Contratante Externo (`RF-038`)** | 1. Geração e validação do `host_view_token` exclusivo.<br>2. Consulta em modo somente-leitura e verificação de sanitização (`buildPublicEventPayload`).<br>3. Revogação do link (`host_view_enabled = false`) e confirmação de bloqueio imediato de novas consultas. | **APROVADA** |
| **JORNADA-D** | **Recuperação de Conta e Revogação de Credenciais** | 1. Solicitação de recuperação de senha (`requestPasswordRecoveryLocal`) e geração de token em `public.auth_tokens`.<br>2. Redefinição de senha (`resetPasswordWithTokenLocal`).<br>3. Verificação de rejeição da senha antiga, revogação automática da sessão anterior em `public.user_sessions`, bloqueio de reutilização do token já consumido e login bem-sucedido com a nova senha. | **APROVADA** |
| **JORNADA-E** | **Persistência, Cascata Relacional e Recuperação** | 1. Exclusão do evento com `ON DELETE CASCADE` no PostgreSQL e verificação de `0` registros órfãos em `guests`, `items` e `event_members`.<br>2. Exportação de dump SQL completo (`generateDatabaseBackupSql`) e restauração integral em instância PostgreSQL isolada (`verifyRestoreInIsolatedDatabase`). | **APROVADA** |
