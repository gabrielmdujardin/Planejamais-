import { spawn } from "child_process"
import path from "path"
import { RequirementRunResult } from "./engine"

export interface E2ERunOptions {
  id?: string
  journey?: boolean
  all?: boolean
  headed?: boolean
  onEvent?: (event: any) => void
}

export interface E2EJourneyResult {
  passed: boolean
  durationMs: number
  stages: Array<{
    stage: number
    title: string
    result: RequirementRunResult
  }>
}

/**
 * Executa o runner Playwright real em scripts/e2e-runner.js e retorna os resultados estruturados.
 */
export async function executeE2ETest(options: E2ERunOptions): Promise<RequirementRunResult | E2EJourneyResult> {
  const runnerScript = path.join(process.cwd(), "scripts", "e2e-runner.js")
  const args = [runnerScript]

  if (options.journey) {
    args.push("--journey=full")
  } else if (options.id) {
    args.push(`--id=${options.id}`)
  } else if (options.all) {
    args.push("--all=true")
  }

  if (options.headed) {
    args.push("--headed=true")
  } else {
    args.push("--headed=false")
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000" },
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdoutBuffer = ""
    let lastResult: any = null
    const logs: string[] = []

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString("utf8")
      const lines = stdoutBuffer.split("\n")
      stdoutBuffer = lines.pop() || ""

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const parsed = JSON.parse(line.trim())
          if (options.onEvent) {
            options.onEvent(parsed)
          }

          if (parsed.type === "test_complete" && parsed.result) {
            lastResult = parsed.result
          } else if (parsed.type === "journey_complete") {
            lastResult = parsed
          } else if (parsed.type === "step_start") {
            logs.push(`[Passo ${parsed.step}] ${parsed.description}`)
          }
        } catch {
          logs.push(line.trim())
        }
      }
    })

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8")
      logs.push(`[STDERR] ${text}`)
    })

    child.on("close", (code) => {
      if (lastResult) {
        if (options.journey) {
          resolve(lastResult as E2EJourneyResult)
        } else {
          // Converte para RequirementRunResult
          const res: RequirementRunResult = {
            id: lastResult.id || options.id || "E2E",
            category: lastResult.category || "RF",
            title: lastResult.title || "Teste E2E Real",
            status: lastResult.passed ? "passed" : "failed",
            durationMs: lastResult.durationMs || 1000,
            timestamp: new Date().toISOString(),
            scenarios: (lastResult.scenarios || []).map((s: any, idx: number) => ({
              id: `${lastResult.id}_s${idx + 1}`,
              name: s.name,
              input: "Interação real com navegador Chromium na aplicação",
              expected: s.expected || "Comportamento esperado atendido",
              actual: s.actual || "Verificado via Playwright",
              passed: s.passed,
              durationMs: Math.round(lastResult.durationMs / (lastResult.scenarios.length || 1)),
            })),
            logs: logs.length > 0 ? logs : ["Teste E2E executado com Playwright Chromium."],
            isRealBrowser: true,
            screenshots: lastResult.evidence?.screenshots || [],
            realBrowserEvidence: {
              url: lastResult.steps?.[0]?.url || "http://127.0.0.1:3000",
              actions: (lastResult.steps || []).map((s: any) => `${s.action} - ${s.description || ""}`),
              requests: lastResult.evidence?.requests || [],
              screenshots: lastResult.evidence?.screenshots || [],
              dbVerified: lastResult.evidence?.dbVerified,
              details: lastResult.evidence?.details,
            },
          }
          resolve(res)
        }
      } else {
        if (code !== 0) {
          reject(new Error(`Runner E2E falhou com código ${code}: ${logs.join(" | ")}`))
        } else {
          reject(new Error("Nenhum resultado retornado pelo runner E2E."))
        }
      }
    })

    child.on("error", (err) => {
      reject(err)
    })
  })
}

