import { buildIcsCalendar, parseFlexibleEventDate } from "../lib/domain/business-rules.ts"
import { BaseJob } from "../lib/job-runner.ts"

export class CalendarSyncJob extends BaseJob {
  getName(): string {
    return "calendar-sync"
  }

  async execute(): Promise<void> {
    const supabase = this.getSupabase()
    await this.log("info", "Starting calendar sync")

    const { data: users } = await supabase.from("users").select("id, email")

    if (!users || users.length === 0) {
      await this.log("warn", "No users found for calendar sync")
      return
    }

    for (const user of users) {
      try {
        await this.generateUserICS(user.id, user.email)
        await this.log("info", `ICS generated for user ${user.email}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        await this.log("error", `Failed to generate ICS for user ${user.email}`, { error: errorMessage })
      }
    }

    await this.log("info", "Calendar sync completed")
  }

  private async generateUserICS(userId: string, userEmail: string): Promise<void> {
    const supabase = this.getSupabase()
    const { data: events } = await supabase.from("events").select("*").eq("user_id", userId)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const upcomingEvents = (events || []).filter((ev: any) => {
      const parsed = parseFlexibleEventDate(ev)
      return parsed && parsed >= startOfToday
    })

    if (upcomingEvents.length === 0) {
      return
    }

    const icsContent = buildIcsCalendar(upcomingEvents, `Planeja+ (${userEmail})`)

    await this.log("info", `Generated ICS with ${upcomingEvents.length} events`, {
      userId,
      eventsCount: upcomingEvents.length,
      icsSize: icsContent.length,
    })
  }
}
