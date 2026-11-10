import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { buttonVariants } from "../lib/design-system.ts"
import {
  calculateBudgetComparison,
  calculateCollaborativeSplit,
  calculateConfirmedParticipants,
  calculateEventTotalCost,
  escapeHtml,
  generateSecureToken,
  isSafeToken,
} from "../lib/domain/business-rules.ts"
import { checkRateLimit, resetRateLimiter } from "../lib/rate-limit.ts"
import { normalizeReportData } from "../lib/reports/data-collector.ts"
import { isValidCronAuthorization } from "../lib/security/cron-auth.ts"
import {
  evaluateRouteAccess,
  isProtectedAppPath,
  isPublicRateLimitedEndpoint,
} from "../lib/security/route-guard.ts"
import { eventPayloadSchema, itemCreateSchema, publicRsvpSchema } from "../lib/validation.ts"

const schemaSql = fs.readFileSync(path.resolve("supabase/schema.sql"), "utf8")
const migrationSql = fs.readFileSync(
  path.resolve("supabase/migrations/20261107000100_complete_tcc_schema_and_rls.sql"),
  "utf8"
)

test("RNF-002: Responsividade e alvos de toque acessíveis (>= 44px no tamanho lg)", () => {
  const lgButtonClasses = buttonVariants({ size: "lg" })
  assert.match(lgButtonClasses, /\bh-11\b/, "Tamanho lg deve possuir h-11 (44px) conforme WCAG 2.1")
})

test("RNF-004: Segurança — Entropia CSPRNG >= 128 bits, Rate Limiting <= 20 req/min/IP e Proteção de Rotas", () => {
  // 1. Entropia mínima de 128 bits (16 bytes = 32 caracteres hexadecimais) sem colisões
  const generated = new Set()
  for (let i = 0; i < 500; i++) {
    const token = generateSecureToken(16)
    assert.ok(token.length >= 32, "Token deve ter no mínimo 32 caracteres hexadecimais (128 bits)")
    assert.equal(isSafeToken(token), true)
    generated.add(token)
  }
  assert.equal(generated.size, 500, "Zero colisões em 500 tokens CSPRNG gerados")

  // 2. Rate limiting bloqueia excesso acima de 10 req/min/IP (respeitando meta <= 20 req/min/IP)
  resetRateLimiter()
  const testIp = "203.0.113.42"
  for (let i = 0; i < 10; i++) {
    assert.equal(checkRateLimit(testIp, 10, 60_000).success, true)
  }
  const eleventh = checkRateLimit(testIp, 10, 60_000)
  assert.equal(eleventh.success, false)

  // Endpoints públicos cobertos pelo Rate Limiting no middleware
  assert.equal(isPublicRateLimitedEndpoint("/api/public-events/tok123", "GET"), true)
  assert.equal(isPublicRateLimitedEndpoint("/api/confirm/tok123/accept", "POST"), true)
  assert.equal(isPublicRateLimitedEndpoint("/api/events/ev1/public-request", "POST"), true)

  // 3. 100% das rotas privadas redirecionam sem sessão Supabase válida (cookie demo ignorado quando Supabase ativo)
  for (const route of ["/dashboard", "/dashboard/analytics", "/create-event", "/event/1", "/contacts", "/calendar", "/profile"]) {
    assert.equal(isProtectedAppPath(route), true)
    const access = evaluateRouteAccess({
      pathname: route,
      hasSupabaseSession: false,
      hasDemoCookie: true,
      supabaseConfigured: true,
    })
    assert.equal(access.isAuthenticated, false)
    assert.equal(access.action, "redirect_login")
  }

  // 4. Proteção contra bypass de cron ('Bearer undefined') e XSS
  assert.equal(isValidCronAuthorization("Bearer undefined", { CRON_SECRET: undefined }), false)
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
})

test("RNF-005: Privacidade e LGPD — Row Level Security (RLS) ativo em todas as tabelas de dados de usuários", () => {
  const userTables = [
    "users",
    "events",
    "guests",
    "guest_companions",
    "items",
    "contacts",
    "contact_lists",
    "event_photos",
  ]

  for (const table of userTables) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i")
    assert.ok(
      rlsRegex.test(schemaSql) || rlsRegex.test(migrationSql),
      `RLS obrigatório ausente para a tabela public.${table}`
    )
  }

  // Política de exclusão da própria conta pelo titular (LGPD)
  assert.match(schemaSql, /for\s+delete(?:\s+to\s+authenticated)?\s+using\s*\(\s*auth\.uid\(\)\s*=\s*id\s*\)/i)
})

test("RNF-006: Confiabilidade e Validação Dupla — Rejeição de payloads malformados e Mass Assignment no servidor", () => {
  // Injeção de atributos administrativos descartada pelo Zod
  const parsedRsvp = publicRsvpSchema.safeParse({
    name: "Convidado Legítimo",
    email: "legitimo@teste.com",
    phone: "11988887777",
    role: "service_role",
    is_admin: true,
    user_id: "attacker-uuid",
  })
  assert.equal(parsedRsvp.success, true)
  assert.equal("role" in parsedRsvp.data, false)
  assert.equal("is_admin" in parsedRsvp.data, false)
  assert.equal("user_id" in parsedRsvp.data, false)

  // Payloads inválidos bloqueados no backend
  assert.equal(eventPayloadSchema.safeParse({ title: "", type: "Festa" }).success, false)
  assert.equal(itemCreateSchema.safeParse({ eventId: "ev-1", name: "Item", price: -0.01 }).success, false)
})

test("RNF-007: Consistência Matemática Zero-Discrepância entre domínio, dashboard e relatórios PDF", () => {
  const guests = [
    { id: "g1", name: "Ana", status: "confirmed", companions: [{ name: "Beto", status: "approved" }] },
    { id: "g2", name: "Caio", status: "confirmed", companions: [{ name: "Dani", status: "pending" }] },
    { id: "g3", name: "Eva", status: "confirmed", companions: [] },
    { id: "g4", name: "Fábio", status: "pending", companions: [] },
    { id: "g5", name: "Rejeitado Externo", source: "public_link", status: "cancelled", companions: [] },
  ]

  const items = [
    { id: "i1", name: "Item 1", price: 33.33, paymentStatus: "paid" },
    { id: "i2", name: "Item 2", price: 33.33, paymentStatus: "pending" },
    { id: "i3", name: "Item 3", price: 33.34, paymentStatus: "pending" },
    { id: "i4", name: "Item Cancelado", price: 500, paymentStatus: "cancelled" },
  ]

  const domainConfirmed = calculateConfirmedParticipants(guests) // 3 titulares + 1 acomp aprovado = 4
  const domainTotalCost = calculateEventTotalCost(items) // 100.00
  const domainSplit = calculateCollaborativeSplit(domainTotalCost, domainConfirmed) // 100 / 4 = 25.00
  const domainBudget = calculateBudgetComparison(80, domainTotalCost) // déficit 20.00

  const report = normalizeReportData(
    [
      {
        id: "ev-consistency",
        title: "Teste Consistência",
        type: "Corporativo",
        financialMode: "corporate_budget",
        budgetEstimated: 80,
        guests,
        items,
      },
    ],
    {
      reportType: "full-event",
      selectedEventId: "ev-consistency",
      includedSections: {
        generalInfo: true,
        kpiSummary: true,
        guestList: true,
        financialDetails: true,
        paretoAnalysis: true,
        attendanceProjection: true,
        riskAlerts: true,
        notesAndSignatures: true,
      },
      guestStatusFilter: "all",
      density: "normal",
    }
  )

  assert.equal(domainConfirmed, 4)
  assert.equal(report.metrics.confirmedGuests, domainConfirmed)
  assert.equal(report.metrics.totalGuests, 4) // g5 externo cancelado não entra
  assert.equal(domainTotalCost, 100)
  assert.equal(report.metrics.totalExpenses, domainTotalCost)
  assert.equal(domainSplit, 25)
  assert.equal(report.metrics.deficit, domainBudget.deficit)
})

test("RNF-010: Manutenibilidade — Build sem ignoreBuildErrors, TypeScript strict e Pipeline CI configurado", () => {
  const nextConfigSrc = fs.readFileSync(path.resolve("next.config.js"), "utf8")
  assert.equal(
    nextConfigSrc.includes("ignoreBuildErrors: true"),
    false,
    "next.config.js não deve mascarar erros de TypeScript com ignoreBuildErrors: true"
  )

  const tsconfig = JSON.parse(fs.readFileSync(path.resolve("tsconfig.json"), "utf8"))
  assert.equal(tsconfig.compilerOptions.strict, true)

  const ciYaml = fs.readFileSync(path.resolve(".github/workflows/ci.yml"), "utf8")
  assert.match(ciYaml, /npm run typecheck/)
  assert.match(ciYaml, /npm run lint/)
  assert.match(ciYaml, /npm test/)

  // Código morto legado removido
  assert.equal(fs.existsSync(path.resolve("src/pages.tsx")), false)
  assert.equal(fs.existsSync(path.resolve("src/api")), false)
})
