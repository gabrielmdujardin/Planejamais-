import { CalendarSyncJob } from "@/jobs/calendar-sync"
import { isValidCronAuthorization } from "@/lib/security/cron-auth"
import { type NextRequest, NextResponse } from "next/server"

async function handleCalendarSync(request: NextRequest) {
  if (!isValidCronAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const job = new CalendarSyncJob()
    const jobRunId = await job.run()

    return NextResponse.json({
      success: true,
      jobRunId,
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

export async function GET(request: NextRequest) {
  return handleCalendarSync(request)
}

export async function POST(request: NextRequest) {
  return handleCalendarSync(request)
}
