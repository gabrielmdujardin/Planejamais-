import { BaseJob } from "../lib/job-runner"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export class CalendarSyncJob extends BaseJob {
  getName(): string {
    return "calendar-sync"
  }

  async execute(): Promise<void> {
    await this.log("info", "Starting calendar sync")

    const { data: users } = await supabase.from("users").select("id, email")

    if (!users) {
      await this.log("warn", "No users found for calendar sync")
      return
    }

    for (const user of users) {
      try {
        await this.generateUserICS(user.id, user.email)
        await this.log("info", `ICS generated for user ${user.email}`)
      } catch (error) {
        await this.log("error", `Failed to generate ICS for user ${user.email}`, { error: (error as Error).message })
      }
    }

    await this.log("info", "Calendar sync completed")
  }

  private async generateUserICS(userId: string, userEmail: string): Promise<void> {
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .gte("date", new Date().toISOString().split("T")[0])

    if (!events || events.length === 0) {
      return
    }

    const icsContent = this.generateICSContent(events, userEmail)

    // In a real implementation, you would save this to a file storage
    await this.log("info", `Generated ICS with ${events.length} events`, {
      userId,
      eventsCount: events.length,
      icsSize: icsContent.length,
    })
  }

  private generateICSContent(events: any[], userEmail: string): string {
    const icsHeader = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Planeja+//Calendar//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ].join("\r\n")

    const icsFooter = "END:VCALENDAR"

    const icsEvents = events
      .map((event) => {
        const startDate = new Date(`${event.date}T${event.time}:00`)
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration

        return [
          "BEGIN:VEVENT",
          `UID:${event.id}@planeja.app`,
          `DTSTART:${this.formatICSDate(startDate)}`,
          `DTEND:${this.formatICSDate(endDate)}`,
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${event.description || ""}`,
          `LOCATION:${event.location || ""}`,
          `ORGANIZER:mailto:${userEmail}`,
          "STATUS:CONFIRMED",
          "END:VEVENT",
        ].join("\r\n")
      })
      .join("\r\n")

    return [icsHeader, icsEvents, icsFooter].join("\r\n")
  }

  private formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }
}
