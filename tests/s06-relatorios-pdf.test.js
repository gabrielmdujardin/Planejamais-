import assert from "node:assert/strict"
import test from "node:test"
import { normalizeReportData, formatBRL, formatPercent } from "../lib/reports/data-collector.ts"
import { generatePdfFileName } from "../lib/reports/pdf-exporter.ts"

// Default section configuration
const defaultSections = {
  generalInfo: true,
  kpiSummary: true,
  guestList: true,
  financialDetails: true,
  paretoAnalysis: true,
  attendanceProjection: true,
  riskAlerts: true,
  notesAndSignatures: true,
}

test("1. Evento sem convidados: cálculos seguros e sem divisão por zero", () => {
  const events = [
    {
      id: "ev-empty",
      title: "Evento Vazio",
      type: "Corporativo",
      financialMode: "corporate_budget",
      budgetEstimated: 10000,
      totalGuests: 0,
      confirmedGuests: 0,
      guests: [],
      items: [{ id: "1", name: "Aluguel", price: 3000, paymentStatus: "paid" }],
    },
  ]

  const report = normalizeReportData(events, {
    reportType: "executive-summary",
    selectedEventId: "ev-empty",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })

  assert.equal(report.metrics.totalGuests, 0)
  assert.equal(report.metrics.confirmedGuests, 0)
  assert.equal(report.metrics.confirmationRate, 0)
  assert.equal(report.metrics.responseRate, 0)
  assert.equal(report.metrics.averageCostPerGuest, 0)
  assert.equal(report.metrics.totalExpenses, 3000)
  assert.equal(report.metrics.availableBalance, 7000)
})

test("2. Evento com centenas de convidados: performance e agregações precisas", () => {
  const largeGuests = Array.from({ length: 350 }, (_, i) => ({
    id: `g-${i}`,
    name: `Convidado Especial Número ${i}`,
    status: i < 210 ? "confirmed" : i < 300 ? "pending" : "declined",
    companions: i % 5 === 0 ? [{ name: `Acomp ${i}` }] : [],
  }))

  const events = [
    {
      id: "ev-large",
      title: "Grande Congresso Nacional 2026",
      type: "Corporativo",
      financialMode: "corporate_budget",
      budgetEstimated: 150000,
      guests: largeGuests,
      items: [
        { id: "i1", name: "Centro de Convenções", price: 65000, paymentStatus: "paid" },
        { id: "i2", name: "Buffet Completo 3 Dias", price: 45000, paymentStatus: "pending" },
      ],
    },
  ]

  const startTime = performance.now()
  const report = normalizeReportData(events, {
    reportType: "full-event",
    selectedEventId: "ev-large",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })
  const duration = performance.now() - startTime

  assert.ok(duration < 20, `Processamento demorou ${duration}ms, esperado < 20ms`)
  assert.equal(report.metrics.totalGuests, 350)
  assert.equal(report.metrics.confirmedGuests, 210)
  assert.equal(report.metrics.pendingGuests, 90)
  assert.equal(report.metrics.declinedGuests, 50)
  assert.equal(Math.round(report.metrics.confirmationRate), 60)
  assert.equal(report.event?.guests.length, 350)
})

test("3. Evento sem despesas: totalCost zero e lista de Pareto limpa", () => {
  const events = [
    {
      id: "ev-free",
      title: "Encontro Comunitário no Parque",
      type: "Colaborativo",
      guests: [{ id: "1", name: "Marcos", status: "confirmed" }],
      items: [],
    },
  ]

  const report = normalizeReportData(events, {
    reportType: "financial",
    selectedEventId: "ev-free",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })

  assert.equal(report.metrics.totalExpenses, 0)
  assert.equal(report.metrics.paidExpenses, 0)
  assert.equal(report.metrics.pendingExpenses, 0)
  assert.equal(report.paretoItems.length, 0)
})

test("4. Evento com muitos itens financeiros: Pareto 80/20 ordenado decrescente", () => {
  const items = [
    { id: "1", name: "Som e Iluminação", price: 5000 },
    { id: "2", name: "Locação de Espaço", price: 40000 },
    { id: "3", name: "Buffet Premium", price: 35000 },
    { id: "4", name: "Segurança Privada", price: 3000 },
    { id: "5", name: "Decoração Floral", price: 12000 },
    { id: "6", name: "Brindes", price: 2000 },
    { id: "7", name: "Fotografia", price: 3000 },
  ]
  const total = items.reduce((acc, it) => acc + it.price, 0) // 100,000

  const events = [
    {
      id: "ev-pareto",
      title: "Gala de Premiação",
      type: "Corporativo",
      budgetEstimated: 120000,
      items,
      guests: [],
    },
  ]

  const report = normalizeReportData(events, {
    reportType: "financial",
    selectedEventId: "ev-pareto",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })

  assert.equal(report.metrics.totalExpenses, 100000)
  assert.equal(report.paretoItems.length, 7)
  // O 1º deve ser Locação de Espaço (40,000 = 40%)
  assert.equal(report.paretoItems[0].name, "Locação de Espaço")
  assert.equal(report.paretoItems[0].value, 40000)
  assert.equal(report.paretoItems[0].cumulative, 40)

  // O 2º deve ser Buffet Premium (35,000 -> acumulado 75%)
  assert.equal(report.paretoItems[1].name, "Buffet Premium")
  assert.equal(report.paretoItems[1].cumulative, 75)
  assert.equal(report.paretoItems[1].isTop80, true)

  // Os 2 primeiros representam 75% do custo e concentram o impacto
})

test("5. Relatório comparativo: identifica múltiplos eventos e calcula médias cruzadas", () => {
  const events = [
    {
      id: "ev-1",
      title: "Seminário Q1",
      type: "Corporativo",
      budgetEstimated: 20000,
      totalGuests: 50,
      confirmedGuests: 40,
      items: [{ price: 15000, paymentStatus: "paid" }],
    },
    {
      id: "ev-2",
      title: "Convenção Q2",
      type: "Corporativo",
      budgetEstimated: 50000,
      totalGuests: 100,
      confirmedGuests: 80,
      items: [{ price: 55000, paymentStatus: "pending" }], // Estouro de 5k
    },
  ]

  const report = normalizeReportData(events, {
    reportType: "comparative",
    selectedEventId: "all",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })

  assert.equal(report.isSingleEvent, false)
  assert.equal(report.metrics.totalEvents, 2)
  assert.equal(report.metrics.totalGuests, 150)
  assert.equal(report.metrics.confirmedGuests, 120)
  assert.equal(report.metrics.totalBudget, 70000)
  assert.equal(report.metrics.totalExpenses, 70000)
  // ev-2 possui risco alto por estouro de verba
  const ev2 = report.events.find((e) => e.id === "ev-2")
  assert.equal(ev2?.riskLevel, "Alto")
})

test("6. Nomes e descrições longas: formatação sem quebra ou corrupção", () => {
  const longTitle = "Simpósio Internacional de Desenvolvimento Tecnológico Avançado e Sustentabilidade Organizacional da América Latina 2026"
  const fileName = generatePdfFileName("executive-summary", longTitle)

  assert.ok(!fileName.includes(" "), "Nome do arquivo não deve conter espaços vazios")
  assert.ok(fileName.startsWith("PlanejaMais_executive_summary_Simposio_Internacional"), "Nome do arquivo deve iniciar padronizado e sem acentos")
  assert.ok(fileName.endsWith(".pdf") === false, "generatePdfFileName gera a base limpa sem extensão duplicada")
})

test("7. Dados opcionais ou ausentes: resiliência a campos nulos ou indefinidos", () => {
  const incompleteEvents = [
    {
      id: "ev-incomplete",
      title: undefined,
      type: undefined,
      date: null,
      budgetEstimated: undefined,
      guests: [
        { id: "1", name: "", email: null, phone: undefined, status: undefined },
      ],
      items: [
        { id: "1", name: null, price: "abc", paymentStatus: null },
      ],
    },
  ]

  const report = normalizeReportData(incompleteEvents, {
    reportType: "executive-summary",
    selectedEventId: "ev-incomplete",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })

  assert.equal(report.events[0].title, "Evento sem título")
  assert.equal(report.events[0].totalCost, 0)
  assert.equal(report.events[0].items[0].price, 0)
  assert.equal(report.events[0].guests[0].name, "Convidado sem nome")
  assert.equal(report.metrics.deficit, 0)
})

test("8. Segregação rigorosa: Não misturar teto orçamentário de corporativo com colaborativo", () => {
  const events = [
    {
      id: "corp",
      type: "Corporativo",
      financialMode: "corporate_budget",
      budgetEstimated: 25000,
      items: [{ price: 20000, paymentStatus: "paid" }],
    },
    {
      id: "colab",
      type: "Colaborativo",
      financialMode: "collaborative_split",
      budgetEstimated: null,
      items: [{ price: 12000, paymentStatus: "pending" }], // Rateio entre amigos
    },
  ]

  const report = normalizeReportData(events, {
    reportType: "financial",
    selectedEventId: "all",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })

  // Teto orçamentário aplica-se apenas ao corporativo
  assert.equal(report.metrics.totalBudget, 25000)
  assert.equal(report.metrics.availableBalance, 5000) // 25k - 20k corporativo = 5k livre
  assert.equal(report.metrics.deficit, 0)
  assert.equal(report.metrics.totalExpenses, 32000) // 20k + 12k
})

test("9. Formatação monetária e percentual em padrão brasileiro", () => {
  const val = 12540.5
  const formattedMoney = formatBRL(val)
  assert.ok(formattedMoney.includes("12.540,50"), "Deve formatar milhar com ponto e decimais com vírgula")
  assert.ok(formattedMoney.includes("R$"), "Deve conter prefixo R$")

  const formattedPct = formatPercent(74.689)
  assert.equal(formattedPct, "74.7%", "Deve arredondar percentual com 1 casa decimal e vírgula")
})
