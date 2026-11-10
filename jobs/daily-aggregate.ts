import {
  calculateConfirmedParticipants,
  calculateEventTotalCost,
  filterEffectiveGuests,
} from "../lib/domain/business-rules.ts"
import { BaseJob } from "../lib/job-runner.ts"

export class DailyAggregateJob extends BaseJob {
  getName(): string {
    return "daily-aggregate"
  }

  async execute(): Promise<void> {
    await this.log("info", "Starting daily aggregation")

    await this.refreshMaterializedViews()
    await this.updateStagingTables()
    await this.generateDailyFacts()

    await this.log("info", "Daily aggregation completed")
  }

  private async refreshMaterializedViews(): Promise<void> {
    const supabase = this.getSupabase()
    await this.log("info", "Refreshing materialized views")

    await supabase.rpc("refresh_materialized_view", { view_name: "mv_event_costs" })
    await supabase.rpc("refresh_materialized_view", { view_name: "mv_rsvp_stats" })

    await this.log("info", "Materialized views refreshed")
  }

  private async updateStagingTables(): Promise<void> {
    const supabase = this.getSupabase()
    await this.log("info", "Updating staging tables")

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase.from("stg_event_costs").delete().lt("processed_at", cutoff)
    await supabase.from("stg_rsvp_stats").delete().lt("processed_at", cutoff)

    const { data: events } = await supabase.from("events").select("id")

    if (events) {
      for (const event of events) {
        const { data: items } = await supabase
          .from("items")
          .select("price, estimated_cost, payment_status")
          .eq("event_id", event.id)

        const activeItems = (items || []).filter((i: any) => i.payment_status !== "cancelled")
        const totalCost = calculateEventTotalCost(activeItems)

        await supabase.from("stg_event_costs").insert({
          event_id: event.id,
          total_cost: totalCost,
          items_count: activeItems.length,
        })

        const { data: guests } = await supabase
          .from("guests")
          .select("id, status, source, guest_companions(id, status)")
          .eq("event_id", event.id)

        const effective = filterEffectiveGuests(guests || [])
        const confirmed = calculateConfirmedParticipants(effective)
        const pending = effective.filter((g: any) => g.status === "pending").length
        const declined = effective.filter((g: any) => g.status === "declined").length

        await supabase.from("stg_rsvp_stats").insert({
          event_id: event.id,
          confirmed_count: confirmed,
          pending_count: pending,
          declined_count: declined,
        })
      }
    }

    await this.log("info", "Staging tables updated")
  }

  private async generateDailyFacts(): Promise<void> {
    const supabase = this.getSupabase()
    await this.log("info", "Generating daily facts")

    const today = new Date().toISOString().split("T")[0]
    const { data: allEvents } = await supabase.from("events").select("id, start_date, date")
    const todayEventIds = (allEvents || [])
      .filter((e: any) => e.start_date === today || e.date === today)
      .map((e: any) => e.id)

    let totalGuests = 0
    let totalCost = 0

    if (todayEventIds.length > 0) {
      const { data: todayGuests } = await supabase
        .from("guests")
        .select("id, status, source")
        .in("event_id", todayEventIds)

      totalGuests = filterEffectiveGuests(todayGuests || []).length

      const { data: todayCosts } = await supabase
        .from("stg_event_costs")
        .select("total_cost")
        .in("event_id", todayEventIds)

      totalCost = (todayCosts || []).reduce((sum: number, cost: any) => sum + Number(cost.total_cost || 0), 0)
    }

    await supabase.from("facts_daily_events").upsert({
      date: today,
      total_events: todayEventIds.length,
      total_guests: totalGuests,
      total_cost: totalCost,
    })

    await this.log("info", "Daily facts generated")
  }
}
