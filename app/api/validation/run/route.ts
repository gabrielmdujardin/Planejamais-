import { executeE2ETest } from "@/lib/validation-center/e2e-bridge"
import { runAllRequirements, runRequirementTest } from "@/lib/validation-center/engine"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 120 // 120 segundos para automação E2E real

export async function POST(request: NextRequest) {
  try {
    let body: {
      id?: string
      all?: boolean
      stream?: boolean
      e2e?: boolean
      headed?: boolean
      journey?: boolean
    } = {}

    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const { id, all, stream, e2e, headed, journey } = body
    const isStreamRequested =
      stream === true ||
      request.headers.get("accept")?.includes("text/event-stream") ||
      request.nextUrl.searchParams.get("stream") === "true"

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
          // Se o requisito específico não estiver mapeado no suite do browser, usa o validador de domínio
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

          send({ type: "start", total: 66, timestamp: new Date().toISOString() })

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
      { error: 'Parâmetro "id" ou "all: true" ou "journey: true" obrigatório.' },
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
