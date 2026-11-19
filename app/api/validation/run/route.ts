import { REQUIREMENTS_CATALOG } from "@/lib/validation-center/catalog"
import { executeE2ETest } from "@/lib/validation-center/e2e-bridge"
import { runAllRequirements, runRequirementTest } from "@/lib/validation-center/engine"
import { runHomologationJourneys } from "@/lib/validation-center/journeys"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 120 // 120 segundos para automação E2E real

export async function POST(request: NextRequest) {
  try {
    // Seção 22: Proteção contra execução acidental de testes com escrita contra banco de produção bloqueado
    if (process.env.PROTECT_PRODUCTION_DB === "true") {
      return NextResponse.json(
        {
          error:
            "A execução de testes automatizados com escrita está bloqueada porque PROTECT_PRODUCTION_DB=true está ativo neste ambiente.",
        },
        { status: 403 }
      )
    }

    let body: {
      id?: string
      ids?: string[]
      all?: boolean
      stream?: boolean
      e2e?: boolean
      headed?: boolean
      journey?: boolean
      homologationJourneys?: boolean
    } = {}

    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const { id, ids, all, stream, e2e, headed, journey, homologationJourneys } = body
    const isStreamRequested =
      stream === true ||
      request.headers.get("accept")?.includes("text/event-stream") ||
      request.nextUrl.searchParams.get("stream") === "true"

    // 0. Execução das 5 Jornadas Integradas de Homologação PostgreSQL (Jornadas A, B, C, D e E — Seção 14 e 15)
    if (homologationJourneys) {
      const journeys = await runHomologationJourneys()
      return NextResponse.json({
        journeys,
        passed: journeys.every((j) => j.passed),
        timestamp: new Date().toISOString(),
      })
    }

    // 0.1 Execução de subconjunto de requisitos (ex: por módulo ou apenas reprovados — Seção 22)
    if (Array.isArray(ids) && ids.length > 0) {
      const results = []
      for (const reqId of ids) {
        const res = await runRequirementTest(reqId)
        results.push(res)
      }
      return NextResponse.json({ results })
    }

    // 1. Execução da Jornada Completa E2E via Streaming SSE
    if (journey && isStreamRequested) {
      const encoder = new TextEncoder()
      const customStream = new ReadableStream({
        async start(controller) {
          const send = (payload: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
          }

          send({ type: "journey_start", totalStages: 8, timestamp: new Date().toISOString() })

          try {
            const journeyResult = await executeE2ETest({
              journey: true,
              headed: headed === true,
              onEvent: (event) => {
                send(event)
              },
            })

            send({
              type: "journey_complete",
              result: journeyResult,
            })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            send({ type: "error", error: message })
          } finally {
            controller.close()
          }
        },
      })

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      })
    }

    // 2. Execução da Jornada Completa E2E (Retorno direto JSON)
    if (journey) {
      const journeyResult = await executeE2ETest({
        journey: true,
        headed: headed === true,
      })
      return NextResponse.json({ result: journeyResult })
    }

    // 3. Execução de um requisito individual (com suporte a E2E Playwright ou Evaluator)
    if (id && id !== "all") {
      if (e2e || headed) {
        try {
          const e2eResult = await executeE2ETest({
            id,
            headed: headed === true,
          })
          return NextResponse.json({ result: e2eResult })
        } catch (e2eErr) {
          console.warn(`Fallback para evaluator para ${id}:`, e2eErr)
          const result = await runRequirementTest(id)
          return NextResponse.json({ result })
        }
      }

      const result = await runRequirementTest(id)
      return NextResponse.json({ result })
    }

    // 4. Execução de todos os requisitos com streaming SSE
    if (isStreamRequested) {
      const encoder = new TextEncoder()
      const customStream = new ReadableStream({
        async start(controller) {
          const send = (payload: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
          }

          send({ type: "start", total: REQUIREMENTS_CATALOG.length, timestamp: new Date().toISOString() })

          try {
            const { results, summary } = await runAllRequirements((result, index, total) => {
              send({
                type: "progress",
                index,
                total,
                result,
              })
            })

            send({
              type: "complete",
              summary,
              resultsCount: results.length,
            })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            send({ type: "error", error: message })
          } finally {
            controller.close()
          }
        },
      })

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      })
    }

    // 5. Execução de todos os requisitos (retorno JSON direto)
    if (all || id === "all") {
      const { results, summary } = await runAllRequirements()
      return NextResponse.json({ results, summary })
    }

    return NextResponse.json(
      { error: 'Parâmetro "id", "ids", "all: true", "journey: true" ou "homologationJourneys: true" obrigatório.' },
      { status: 400 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno ao executar validação."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  const e2e = request.nextUrl.searchParams.get("e2e") === "true"
  const headed = request.nextUrl.searchParams.get("headed") === "true"

  if (id && id !== "all") {
    try {
      if (e2e || headed) {
        const e2eResult = await executeE2ETest({ id, headed })
        return NextResponse.json({ result: e2eResult })
      }
      const result = await runRequirementTest(id)
      return NextResponse.json({ result })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Requisito não encontrado."
      return NextResponse.json({ error: message }, { status: 404 })
    }
  }

  return NextResponse.json(
    { error: 'Parâmetro "id" obrigatório na consulta GET.' },
    { status: 400 }
  )
}
