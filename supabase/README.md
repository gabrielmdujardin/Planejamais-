# Supabase do Planeja+

Este diretorio reconstrui o banco usado pelo codigo atual do projeto.

## Arquivos

- `supabase/schema.sql`: schema completo para executar no SQL Editor do Supabase.
- `supabase/seed.sql`: seed minimo e seguro, sem dados sensiveis.

## Tabelas Detectadas

- `users`: perfil publico espelhado de `auth.users`, usado por calendario/ICS e jobs.
- `events`: eventos do usuario autenticado.
- `guests`: convidados, convites e fluxo de solicitacao publica.
- `guest_companions`: acompanhantes de convidados.
- `items`: itens/custos de eventos.
- `event_photos`: metadados de fotos da galeria.
- `job_runs`, `job_logs`: execucoes e logs de jobs.
- `stg_event_costs`, `stg_rsvp_stats`, `facts_daily_events`: pipeline analitico.
- `mv_event_costs`, `mv_rsvp_stats`: views materializadas do pipeline.

## Como Aplicar Em Um Supabase Novo

1. Abra o novo projeto no Supabase.
2. Va em `SQL Editor`.
3. Cole e execute todo o conteudo de `supabase/schema.sql`.
4. Depois execute `supabase/seed.sql`.
5. Em `Authentication > URL Configuration`, configure a URL local, por exemplo `http://localhost:3000`.
6. Crie pelo menos um usuario real pelo Auth ou pelo fluxo de cadastro da aplicacao.
7. Copie `Project URL`, `anon public key` e `service_role key` para `.env.local`.

## Variaveis

Use `.env.example` como base:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anon publica, pode ir para o frontend.
- `SUPABASE_SERVICE_ROLE_KEY`: somente backend/jobs/API routes. Nunca expor no cliente.
- `JOBS_SECRET_TOKEN`: bearer token para rotas de jobs.
- `NEXT_PUBLIC_APP_URL`: URL base usada nos links de email.
- `RESEND_API_KEY`: usado por `src/services/email.service.ts`, se envio real estiver ativo.

## RLS e Seguranca

RLS foi ativado nas tabelas sensiveis. Usuarios autenticados acessam apenas registros ligados aos seus eventos por `auth.uid()`. Tabelas de pipeline aceitam apenas `service_role`.

As rotas publicas de convite usam `createAdminClient()` no backend, entao nao foi aberta politica publica direta para `guests` ou `events`. Isso evita expor convidados pelo cliente anonimo.

## Storage

Nao ha uso real de `supabase.storage` no codigo atual. Uploads de imagens sao simulados/localStorage/base64, entao nenhum bucket e necessario agora. Se migrar galeria ou imagens de itens para Storage, crie um bucket privado e politicas baseadas no evento do arquivo.

## RPC

O codigo usa `refresh_materialized_view(view_name)` nos jobs. Ela foi criada com whitelist para:

- `mv_event_costs`
- `mv_rsvp_stats`

A rota `app/api/setup/migrations/route.ts` chama `exec_sql`, mas essa funcao nao foi criada por seguranca. Ela permite executar SQL arbitrario via API e deve ser removida ou protegida antes de producao.

## Inferencias Feitas

- `users` foi criado como perfil publico porque jobs e ICS usam `.from("users")`, enquanto o Supabase Auth guarda usuarios em `auth.users`.
- `events.status` foi adicionado porque `src/services/event.service.ts` insere e le esse campo.
- `items` tem `price` e `estimated_cost`; o frontend usa `price` e o pipeline usa `estimated_cost`. Um trigger mantem os dois sincronizados.
- `guests` tem `token` e `confirmation_token`; rotas diferentes usam nomes diferentes. Um trigger sincroniza os campos.
- `invite_sent_at` e `sent_at` tambem coexistem por compatibilidade.

## Inconsistencias No Codigo

- `context/auth-context.tsx`: login/cadastro ainda sao mockados em `localStorage`, mas `app/actions/events.ts` e varias APIs esperam `supabase.auth.getUser()`. Para persistir dados reais, troque o contexto para Supabase Auth.
- `app/create-event/page.tsx`: cria eventos somente no Zustand/localStorage, nao chama `createEvent` nem `EventService`.
- `jobs/daily-aggregate.ts`: usa `items.estimated_cost`; mantido no schema, mas o frontend usa `price`.
- `app/api/events/[eventId]/send-invites/route.ts`: usa `confirmation_token` e `invite_sent_at`; o fluxo novo usa `token` e `sent_at`. O schema sincroniza por compatibilidade, mas o ideal e padronizar para um unico par.
- `app/api/setup/migrations/route.ts`: depende de RPC `exec_sql`. Sugestao: remover essa rota e aplicar migrations via SQL Editor/CLI.
- `events.date` esta como `text` porque o frontend mistura formato humano (`Sabado, 15 de Junho`) e formato ISO. Para filtros por data funcionarem bem, padronize no codigo para `date` ISO (`YYYY-MM-DD`) e depois migre a coluna para `date`.

## Checklist De Validacao

- `schema.sql` executou sem erro.
- `seed.sql` executou sem erro.
- `.env.local` contem chaves do novo Supabase.
- O usuario consegue autenticar com Supabase Auth.
- Um evento criado aparece em `events` com `user_id = auth.uid()`.
- Convidados aparecem apenas para o dono do evento.
- Fluxo publico `/evento/[eventId]/solicitar` cria guest e companions via API.
- Fluxo `/confirm/[token]` encontra o convite e atualiza resposta.
- Jobs rodam com `Authorization: Bearer $JOBS_SECRET_TOKEN`.
- `service_role` nao aparece em nenhum componente client-side.
