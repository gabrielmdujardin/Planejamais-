import { getPostgresHealth } from "@/lib/db/postgres"
import { getStorageRootDir } from "@/lib/storage/local-storage"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const dbHealth = await getPostgresHealth()
    return NextResponse.json({
      status: "healthy",
      provider: "postgresql-local",
      supabaseIndependent: true,
      database: dbHealth,
      storage: {
        rootDir: getStorageRootDir(),
      },
      mail: {
        smtpHost: process.env.SMTP_HOST || "127.0.0.1",
        smtpPort: Number(process.env.SMTP_PORT || 1025),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database health check failed"
    return NextResponse.json(
      {
        status: "unhealthy",
        error: message,
      },
      { status: 500 }
    )
  }
}
