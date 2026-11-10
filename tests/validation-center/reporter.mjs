/**
 * Reporter customizado do node:test para a Central de Validação de Requisitos (Planeja+).
 *
 * Converte os eventos reais do executor de testes do Node.js em linhas JSON prefixadas,
 * consumidas pela rota /api/validation/run e transmitidas à interface por SSE.
 * Nenhum resultado é inventado: cada linha corresponde a um evento emitido pelo node:test.
 */

const MARKER = "@@PV@@"
const MAX_VALUE_LENGTH = 600

function truncate(value) {
  if (value === undefined) return undefined
  let text
  try {
    text = typeof value === "string" ? value : JSON.stringify(value)
  } catch {
    text = String(value)
  }
  if (text === undefined) text = String(value)
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}… (${text.length} caracteres)` : text
}

function serializeError(error) {
  if (!error) return undefined
  const cause = error.cause && typeof error.cause === "object" ? error.cause : error
  return {
    message: String(cause.message || error.message || "Falha sem mensagem").slice(0, 1500),
    expected: truncate(cause.expected),
    actual: truncate(cause.actual),
    operator: cause.operator,
    code: cause.code || error.code,
  }
}

function line(payload) {
  return `${MARKER}${JSON.stringify(payload)}\n`
}

export default async function* validationReporter(source) {
  for await (const event of source) {
    const { type, data } = event

    if (type === "test:pass" || type === "test:fail") {
      if (data.skip || data.todo) continue
      if (data.details?.type === "suite") continue
      yield line({
        type: type === "test:pass" ? "pass" : "fail",
        name: data.name,
        file: data.file,
        nesting: data.nesting,
        durationMs: data.details?.duration_ms ?? 0,
        error: type === "test:fail" ? serializeError(data.details?.error) : undefined,
      })
      continue
    }

    if (type === "test:stdout" || type === "test:stderr") {
      yield line({ type: type === "test:stdout" ? "stdout" : "stderr", file: data.file, message: data.message })
      continue
    }

    if (type === "test:diagnostic" && data.nesting === 0) {
      yield line({ type: "diagnostic", message: data.message })
    }
  }
}

