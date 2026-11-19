import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

// Executa o PostgreSQL 16 local em instância isolada para os testes de integração
process.env.PG_EMBEDDED = "true"
process.env.PGLITE_MEMORY = "true"
delete process.env.NEXT_PUBLIC_SUPABASE_URL
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
delete process.env.SUPABASE_SERVICE_ROLE_KEY

import {
  changePasswordLocal,
  confirmEmailWithToken,
  deleteUserAccountLocal,
  getUserFromSessionToken,
  loginUserLocal,
  registerUserLocal,
  requestPasswordRecoveryLocal,
  resetPasswordWithTokenLocal,
  revokeSessionByToken,
} from "../lib/auth/auth-service.ts"
import { hashPassword, verifyPassword } from "../lib/auth/password.ts"
import { createLocalPgClient } from "../lib/db/pg-client.ts"
import { ensurePostgresInitialized, getPostgresHealth, pgQuery } from "../lib/db/postgres.ts"
import {
  deleteFileFromLocalStorage,
  readFileFromLocalStorage,
  saveFileToLocalStorage,
} from "../lib/storage/local-storage.ts"
import {
  generateDatabaseBackupSql,
  verifyRestoreInIsolatedDatabase,
} from "../scripts/db-backup-restore.mjs"
import { EmailService } from "../src/services/email.service.ts"

test("1. Independência total do Supabase: Nenhum módulo de runtime importa @supabase/* e o banco opera sem variáveis do Supabase", async () => {
  const runtimeFiles = [
    "lib/supabase/server.ts",
    "lib/supabase/admin.ts",
    "lib/supabase/client.ts",
    "lib/supabase.ts",
    "lib/job-queue.ts",
    "middleware.ts",
    "context/auth-context.tsx",
    "app/actions/events.ts",
    "app/actions/items.ts",
    "app/actions/contacts.ts",
    "app/actions/photos.ts",
    "app/actions/profile.ts",
  ]

  for (const relPath of runtimeFiles) {
    const content = fs.readFileSync(path.resolve(relPath), "utf8")
    assert.equal(
      content.includes("@supabase/ssr") || content.includes("@supabase/supabase-js"),
      false,
      `O arquivo ${relPath} não deve importar pacotes @supabase/*`
    )
  }

  await ensurePostgresInitialized()
  const health = await getPostgresHealth()
  assert.equal(health.connected, true)
  assert.equal(health.migrationsApplied, true)
  assert.match(health.version, /PostgreSQL (16|17|18)/i)
})

test("2. Reconstrução completa do PostgreSQL local (planeja_plus): Tabelas, Views Materializadas, Triggers e Funções PL/pgSQL", async () => {
  await ensurePostgresInitialized()

  const expectedTables = [
    "users",
    "user_credentials",
    "user_sessions",
    "auth_tokens",
    "events",
    "guests",
    "guest_companions",
    "items",
    "event_photos",
    "contacts",
    "contact_lists",
    "stored_files",
    "email_outbox",
    "job_runs",
    "job_logs",
    "stg_event_costs",
    "stg_rsvp_stats",
    "facts_daily_events",
    "event_roles",
    "event_permissions",
    "event_members",
    "event_member_permissions",
    "event_invitations",
    "event_audit_logs",
  ]

  const tablesRes = await pgQuery(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  )
  const existingTableNames = new Set(tablesRes.rows.map((r) => r.tablename))

  for (const tbl of expectedTables) {
    assert.equal(
      existingTableNames.has(tbl),
      true,
      `A tabela public.${tbl} deve existir no banco planeja_plus`
    )
  }

  // Verifica catálogo dos 5 papéis RBAC (RN-002)
  const rolesRes = await pgQuery(`SELECT code FROM public.event_roles ORDER BY hierarchy_level DESC`)
  assert.deepEqual(
    rolesRes.rows.map((r) => r.code),
    ["owner", "admin", "collaborator", "viewer", "external_host"]
  )
})

test("3. Autenticação Própria (Seção 7): Hash Scrypt/Argon2id, Cadastro, Unicidade RN-001, Confirmação de E-mail, Login, Bloqueio por Força Bruta, Recuperação de Senha e Revogação de Sessão", async () => {
  // 3.1 Hash seguro nunca em texto puro
  const hash = hashPassword("SenhaForte#2026")
  assert.equal(hash.includes("SenhaForte#2026"), false)
  assert.match(hash, /^\$scrypt\$/)
  assert.equal(verifyPassword("SenhaForte#2026", hash), true)
  assert.equal(verifyPassword("SenhaErrada", hash), false)

  // 3.2 Cadastro real de usuário
  const reg = await registerUserLocal({
    email: "arquiteto.pg@planeja.local",
    password: "PgPassword2026!",
    name: "Arquiteto PostgreSQL",
    phone: "11988887777",
    location: "São Paulo, SP",
  })

  assert.ok(reg.user.id)
  assert.equal(reg.user.email, "arquiteto.pg@planeja.local")
  assert.ok(reg.sessionToken)
  assert.ok(reg.verificationToken)

  // 3.3 Prevenção de conta duplicada (RN-001)
  await assert.rejects(
    async () => {
      await registerUserLocal({
        email: "ARQUITETO.PG@planeja.local",
        password: "OutraSenha123",
        name: "Duplicado",
      })
    },
    /Já existe uma conta cadastrada/i
  )

  // 3.4 Confirmação de e-mail
  const verifyRes = await confirmEmailWithToken(reg.verificationToken)
  assert.equal(verifyRes.success, true)
  assert.equal(verifyRes.email, "arquiteto.pg@planeja.local")

  // Token consumido não pode ser reutilizado
  const verifyAgain = await confirmEmailWithToken(reg.verificationToken)
  assert.equal(verifyAgain.success, false)

  // 3.5 Validação de sessão ativa e revogação no logout
  const sessionUser = await getUserFromSessionToken(reg.sessionToken)
  assert.ok(sessionUser)
  assert.equal(sessionUser.email_verified, true)

  await revokeSessionByToken(reg.sessionToken)
  const afterLogout = await getUserFromSessionToken(reg.sessionToken)
  assert.equal(afterLogout, null)

  // 3.6 Login e proteção contra força bruta (5 falhas bloqueiam a conta temporariamente)
  for (let i = 0; i < 5; i++) {
    await assert.rejects(
      async () => {
        await loginUserLocal({
          email: "arquiteto.pg@planeja.local",
          password: "SenhaIncorreta",
        })
      },
      /inválidos/i
    )
  }

  await assert.rejects(
    async () => {
      await loginUserLocal({
        email: "arquiteto.pg@planeja.local",
        password: "PgPassword2026!",
      })
    },
    /temporariamente bloqueada/i
  )

  // 3.7 Recuperação e redefinição de senha desbloqueia conta e revoga sessões anteriores
  const recovery = await requestPasswordRecoveryLocal("arquiteto.pg@planeja.local")
  assert.equal(recovery.success, true)
  assert.ok(recovery.resetToken)

  const resetRes = await resetPasswordWithTokenLocal({
    resetToken: recovery.resetToken,
    newPassword: "NovaSenhaSegura2026!",
  })
  assert.equal(resetRes.success, true)

  // Login com a nova senha funciona normalmente
  const loginAfterReset = await loginUserLocal({
    email: "arquiteto.pg@planeja.local",
    password: "NovaSenhaSegura2026!",
  })
  assert.equal(loginAfterReset.user.email, "arquiteto.pg@planeja.local")

  // 3.8 Alteração de senha autenticado
  const changeRes = await changePasswordLocal({
    userId: loginAfterReset.user.id,
    currentPassword: "NovaSenhaSegura2026!",
    newPassword: "SenhaFinal2026!",
  })
  assert.equal(changeRes.success, true)
})

test("4. Persistência Real de Eventos, Convidados, Financeiro, RBAC (RN-002) e Transferência Transacional no PostgreSQL", async () => {
  const db = createLocalPgClient({ role: "service_role" })

  const ownerReg = await registerUserLocal({
    email: "owner.evento@planeja.local",
    password: "OwnerPass123!",
    name: "Organizador Proprietário",
  })
  const collabReg = await registerUserLocal({
    email: "colab.evento@planeja.local",
    password: "ColabPass123!",
    name: "Colaborador Financeiro",
  })

  // 4.1 Criação de evento dispara trigger trg_ensure_event_owner_member automaticamente
  const { data: createdEvent, error: evErr } = await db
    .from("events")
    .insert({
      user_id: ownerReg.user.id,
      title: "Congresso PostgreSQL 2026",
      type: "Corporativo",
      date: "2026-12-10",
      time: "09:00",
      location: "Centro de Convenções",
      description: "Evento persistido no PostgreSQL 16 local",
      budget_estimated: 25000,
    })
    .select()
    .single()

  assert.equal(evErr, null)
  assert.ok(createdEvent.id)

  // Verifica que o trigger criou automaticamente o registro de owner em public.event_members
  const { data: ownerMembers } = await db
    .from("event_members")
    .select("*")
    .eq("event_id", createdEvent.id)

  assert.equal(ownerMembers.length, 1)
  assert.equal(ownerMembers[0].role, "owner")
  assert.equal(ownerMembers[0].status, "active")
  assert.equal(ownerMembers[0].user_id, ownerReg.user.id)

  // 4.2 Adição de colaborador com permissão apenas em 'financial'
  const { data: collabMember, error: colErr } = await db
    .from("event_members")
    .insert({
      event_id: createdEvent.id,
      user_id: collabReg.user.id,
      email: collabReg.user.email,
      name: collabReg.user.name,
      role: "collaborator",
      status: "active",
      preset: "financial",
      permissions: {
        event: ["view"],
        financial: ["view", "create", "edit", "delete", "export"],
        guests: ["view"],
      },
    })
    .select()
    .single()

  assert.equal(colErr, null)

  // 4.3 Verifica função SQL public.has_event_permission no PostgreSQL
  const canEditFinancial = await db.rpc("has_event_permission", {
    p_event_id: createdEvent.id,
    p_user_id: collabReg.user.id,
    p_module: "financial",
    p_action: "edit",
  })
  assert.equal(canEditFinancial.data, true)

  const canDeleteEvent = await db.rpc("has_event_permission", {
    p_event_id: createdEvent.id,
    p_user_id: collabReg.user.id,
    p_module: "event",
    p_action: "delete_event",
  })
  assert.equal(canDeleteEvent.data, false)

  // 4.4 Lançamento financeiro, trigger sync_item_costs e view materializada mv_event_costs
  await db.from("items").insert([
    {
      event_id: createdEvent.id,
      name: "Sonorização Profissional",
      price: 4500,
      quantity: 3,
      payment_status: "paid",
    },
    {
      event_id: createdEvent.id,
      name: "Coffee Break Executivo",
      price: 5500,
      quantity: 1,
      payment_status: "pending",
    },
  ])

  await db.rpc("refresh_materialized_view", { view_name: "mv_event_costs" })
  const { data: mvCost } = await db
    .from("mv_event_costs")
    .select("*")
    .eq("id", createdEvent.id)
    .single()

  assert.equal(Number(mvCost.total_cost), 10000)
  assert.equal(Number(mvCost.items_count), 2)

  // 4.5 Convidados, acompanhantes, hidratação relacional e view materializada mv_rsvp_stats
  const { data: guest1 } = await db
    .from("guests")
    .insert({
      event_id: createdEvent.id,
      name: "Dra. Helena Convidada",
      email: "helena@convidada.com",
      status: "confirmed",
      token: "tok-helena-1234567890",
    })
    .select()
    .single()

  await db.from("guest_companions").insert([
    { guest_id: guest1.id, name: "Acompanhante Aprovado", status: "approved" },
    { guest_id: guest1.id, name: "Acompanhante Pendente", status: "awaiting_approval" },
  ])

  await db.rpc("refresh_materialized_view", { view_name: "mv_rsvp_stats" })
  const { data: mvRsvp } = await db
    .from("mv_rsvp_stats")
    .select("*")
    .eq("id", createdEvent.id)
    .single()

  // 1 titular confirmado + 1 acompanhante aprovado = 2 (RN-005)
  assert.equal(Number(mvRsvp.confirmed_count), 2)

  // 4.6 Transferência transacional de titularidade no PostgreSQL (RF-043)
  const transferRpc = await db.rpc("transfer_event_ownership", {
    p_event_id: createdEvent.id,
    p_actor_user_id: ownerReg.user.id,
    p_new_owner_member_id: collabMember.id,
    p_confirmation_title: "Congresso PostgreSQL 2026",
  })
  assert.equal(transferRpc.error, null)
  assert.equal(transferRpc.data.new_owner_user_id, collabReg.user.id)

  const { data: afterMembers } = await db
    .from("event_members")
    .select("*")
    .eq("event_id", createdEvent.id)

  const activeOwners = afterMembers.filter((m) => m.role === "owner" && m.status === "active")
  assert.equal(activeOwners.length, 1)
  assert.equal(activeOwners[0].user_id, collabReg.user.id)
})

test("5. Substituição do Supabase Storage (Seção 10): Upload local, validação MIME/tamanho, SHA-256 e remoção", () => {
  // 1x1 pixel PNG transparente em base64
  const samplePngDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

  const saved = saveFileToLocalStorage({
    bucket: "event-photos",
    filename: "foto-palestra.png",
    content: samplePngDataUrl,
  })

  assert.ok(saved.id)
  assert.equal(saved.mimeType, "image/png")
  assert.ok(saved.sizeBytes > 0)
  assert.equal(saved.checksumSha256.length, 64)
  assert.match(saved.publicUrl, /^\/api\/storage\/event-photos\//)

  const readBack = readFileFromLocalStorage("event-photos", saved.filename)
  assert.ok(readBack)
  assert.equal(readBack.mimeType, "image/png")
  assert.equal(readBack.buffer.length, saved.sizeBytes)

  // Rejeita arquivo executável malicioso
  assert.throws(() => {
    saveFileToLocalStorage({
      bucket: "event-photos",
      filename: "exploit.exe",
      content: "data:application/x-msdownload;base64,TVqQAAMAAAAEAAAA",
    })
  }, /Tipo de arquivo não permitido/i)

  const deleted = deleteFileFromLocalStorage("event-photos", saved.publicUrl)
  assert.equal(deleted, true)
  assert.equal(readFileFromLocalStorage("event-photos", saved.filename), null)
})

test("6. Serviço de E-mail Transacional e Outbox PostgreSQL (Seção 8): Templates e distinção estrita de Mailpit vs Entrega Externa", async () => {
  const emailRes = await EmailService.sendTeamInvitationEmail({
    to: "membro.equipe@planeja.local",
    inviteeName: "Carlos Equipe",
    inviterName: "Gabriel Organizador",
    eventTitle: "Simpósio de Engenharia 2026",
    eventId: "evt-simposio-01",
    roleLabel: "Administrador",
    inviteToken: "tok-equipe-seguro-2026",
    expiresAt: "25/12/2026",
  })

  // Em ambiente local sem SMTP externo autenticado, isExternalDelivery é obrigatoriamente false
  assert.equal(emailRes.isExternalDelivery, false)

  const outboxRes = await pgQuery(
    `SELECT * FROM public.email_outbox WHERE to_email = 'membro.equipe@planeja.local' ORDER BY created_at DESC LIMIT 1`
  )
  assert.equal(outboxRes.rows.length, 1)
  assert.equal(outboxRes.rows[0].template, "team_invitation")
  assert.equal(outboxRes.rows[0].is_external_delivery, false)
})

test("7. Backup e Restauração Completa em Banco PostgreSQL 16 Isolado (Seção 15)", async () => {
  const { sqlContent, counts } = await generateDatabaseBackupSql()
  assert.ok(sqlContent.includes("INSERT INTO public.\"users\""))
  assert.ok(sqlContent.includes("INSERT INTO public.\"events\""))
  assert.ok(counts.users >= 3)
  assert.ok(counts.events >= 1)

  const verification = await verifyRestoreInIsolatedDatabase(sqlContent)
  assert.equal(verification.success, true)
  assert.equal(verification.restoredCounts.users, counts.users)
  assert.equal(verification.restoredCounts.events, counts.events)
  assert.equal(verification.restoredCounts.event_members, counts.event_members)
  assert.equal(verification.restoredCounts.items, counts.items)
  assert.equal(verification.restoredCounts.guests, counts.guests)
})
