import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

function isAuthorizedAdminRequest(request: NextRequest): boolean {
  const secret = (process.env.JOBS_SECRET_TOKEN || process.env.CRON_SECRET || "").trim()
  if (!secret) return false
  const authHeader = request.headers.get("authorization") || ""
  return authHeader === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const supabaseAdmin = createAdminClient()

    const alterQueries = [
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS token TEXT UNIQUE`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS notes TEXT`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS accessibility_needs TEXT`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS requested_companions_count INTEGER DEFAULT 0`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    ]

    for (const query of alterQueries) {
      const { error } = await (supabaseAdmin as any).rpc("exec_sql", { query })
      if (error && !error.message.includes("already exists")) {
        console.warn(`Warning: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migrations administrativas verificadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao executar migrations:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
