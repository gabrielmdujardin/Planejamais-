import { getAllRequirements } from "@/lib/validation-center/engine"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const catalog = getAllRequirements()
    return NextResponse.json({
      total: catalog.length,
      requirements: catalog,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao carregar catálogo."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

