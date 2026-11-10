import { PendingInvitesJob } from "@/jobs/pending-invites"
import { isValidCronAuthorization } from "@/lib/security/cron-auth"
import { type NextRequest, NextResponse } from "next/server"

async function handlePendingInvites(request: NextRequest) {
  if (!isValidCronAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const job = new PendingInvitesJob()
    const jobRunId = await job.run()

    return NextResponse.json({
      success: true,
      jobRunId,
      message: "Pending invites job completed successfully",
    })
  } catch (error) {
    console.error("Pending invites job failed:", error)
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
  return handlePendingInvites(request)
}

export async function POST(request: NextRequest) {
  return handlePendingInvites(request)
}
