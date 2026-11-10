import {
  filterEligibleReminderGuests,
  generateSecureToken,
  parseFlexibleEventDate,
} from "../lib/domain/business-rules.ts"
import { BaseJob } from "../lib/job-runner.ts"
import { EmailService } from "../src/services/email.service.ts"

export class PendingInvitesJob extends BaseJob {
  getName(): string {
    return "pending-invites"
  }

  async execute(): Promise<void> {
    const supabase = this.getSupabase()
    await this.log("info", "Starting pending invites processing")

    const { data: pendingGuests, error } = await supabase
      .from("guests")
      .select(
        `
        id,
        name,
        email,
        phone,
        status,
        token,
        confirmation_token,
        confirmation_deadline,
        events!inner (
          id,
          title,
          date,
          start_date,
          time,
          start_time,
          location,
          rsvp_deadline
        )
      `
      )
      .eq("status", "pending")

    if (error) {
      throw new Error(error.message)
    }

    // RN-017: Apenas convidados com status 'pending' E e-mail válido, em eventos ainda não realizados
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const eligible = filterEligibleReminderGuests(pendingGuests || []).filter((guest: any) => {
      const ev = Array.isArray(guest.events) ? guest.events[0] : guest.events
      if (!ev) return false
      const parsed = parseFlexibleEventDate(ev)
      return !parsed || parsed >= startOfToday
    })

    if (eligible.length === 0) {
      await this.log("info", "No eligible pending invites found")
      return
    }

    await this.log("info", `Found ${eligible.length} eligible pending invites`)

    for (const guest of eligible) {
      try {
        await this.sendReminder(guest)
        await this.log("info", `Reminder processed for ${guest.email}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        await this.log("error", `Failed to send reminder to ${guest.email}`, { error: errorMessage })
      }
    }

    await this.log("info", "Pending invites processing completed")
  }

  private async sendReminder(guest: any): Promise<void> {
    const supabase = this.getSupabase()
    const event = Array.isArray(guest.events) ? guest.events[0] : guest.events
    const token = guest.token || guest.confirmation_token || generateSecureToken(16)
    const deadlineDate = guest.confirmation_deadline
      ? new Date(guest.confirmation_deadline)
      : event?.rsvp_deadline
      ? new Date(event.rsvp_deadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    if (!guest.token || !guest.confirmation_token) {
      await supabase
        .from("guests")
        .update({
          token,
          confirmation_token: token,
          confirmation_deadline: deadlineDate.toISOString(),
        })
        .eq("id", guest.id)
        .eq("status", "pending")
    }

    const formattedDeadline = deadlineDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const result = await EmailService.sendConfirmationReminder({
      to: guest.email,
      guestName: guest.name,
      eventTitle: event?.title || "Evento Planeja+",
      confirmationToken: token,
      confirmationDeadline: formattedDeadline,
    })

    if (result.success) {
      await supabase
        .from("guests")
        .update({ invite_sent_at: new Date().toISOString(), sent_at: new Date().toISOString() })
        .eq("id", guest.id)
    } else {
      await this.log("warn", `Email provider skipped or failed for ${guest.email}`, {
        reason: result.error,
      })
    }
  }
}
