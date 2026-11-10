import { DailyAggregateJob } from "@/jobs/daily-aggregate"
import { isValidCronAuthorization } from "@/lib/security/cron-auth"
import { type NextRequest, NextResponse } from "next/server"

async function handleDailyAggregate(request: NextRequest) {
  if (!isValidCronAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const job = new DailyAggregateJob()
    const jobRunId = await job.run()

    return NextResponse.json({
      success: true,
      jobRunId,
      message: "Daily aggregate job completed successfully",
    })
  } catch (error) {
    console.error("Daily aggregate job failed:", error)
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
  return handleDailyAggregate(request)
}

export async function POST(request: NextRequest) {
  return handleDailyAggregate(request)
}
