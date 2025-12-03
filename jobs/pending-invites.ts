import { BaseJob } from "../lib/job-runner"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export class PendingInvitesJob extends BaseJob {
  getName(): string {
    return "pending-invites"
  }

  async execute(): Promise<void> {
    await this.log("info", "Starting pending invites processing")

    const { data: pendingGuests } = await supabase
      .from("guests")
      .select(`
        id,
        name,
        email,
        phone,
        events (
          id,
          title,
          date,
          time,
          location
        )
      `)
      .eq("status", "pending")
      .gte("events.date", new Date().toISOString().split("T")[0])

    if (!pendingGuests || pendingGuests.length === 0) {
      await this.log("info", "No pending invites found")
      return
    }

    await this.log("info", `Found ${pendingGuests.length} pending invites`)

    for (const guest of pendingGuests) {
      try {
        await this.sendReminder(guest)
        await this.log("info", `Reminder sent to ${guest.email}`)
      } catch (error) {
        await this.log("error", `Failed to send reminder to ${guest.email}`, { error: (error as Error).message })
      }
    }

    await this.log("info", "Pending invites processing completed")
  }

  private async sendReminder(guest: any): Promise<void> {
    // Simulate email/WhatsApp sending
    const reminderData = {
      to: guest.email,
      subject: `Lembrete: ${guest.events.title}`,
      body: `Olá ${guest.name}, você ainda não confirmou sua presença no evento "${guest.events.title}" que acontecerá em ${guest.events.date} às ${guest.events.time} em ${guest.events.location}.`,
      type: "email",
    }

    // In a real implementation, you would integrate with email/SMS providers
    await this.log("info", "Reminder sent", { reminderData })

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
