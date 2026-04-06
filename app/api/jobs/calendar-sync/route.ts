import { type NextRequest, NextResponse } from "next/server"
import { CalendarSyncJob } from "@/jobs/calendar-sync"

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization")
  const expectedToken = process.env.JOBS_SECRET_TOKEN

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const job = new CalendarSyncJob()
    await job.run()

    return NextResponse.json({
      success: true,
      message: "Calendar sync job completed successfully",
    })
  } catch (error) {
    console.error("Calendar sync job failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
