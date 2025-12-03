import { BaseJob } from "../lib/job-runner"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export class DailyAggregateJob extends BaseJob {
  getName(): string {
    return "daily-aggregate"
  }

  async execute(): Promise<void> {
    await this.log("info", "Starting daily aggregation")

    // Refresh materialized views
    await this.refreshMaterializedViews()

    // Update staging tables
    await this.updateStagingTables()

    // Generate daily facts
    await this.generateDailyFacts()

    await this.log("info", "Daily aggregation completed")
  }

  private async refreshMaterializedViews(): Promise<void> {
    await this.log("info", "Refreshing materialized views")

    await supabase.rpc("refresh_materialized_view", { view_name: "mv_event_costs" })
    await supabase.rpc("refresh_materialized_view", { view_name: "mv_rsvp_stats" })

    await this.log("info", "Materialized views refreshed")
  }

  private async updateStagingTables(): Promise<void> {
    await this.log("info", "Updating staging tables")

    // Clear old staging data
    await supabase
      .from("stg_event_costs")
      .delete()
      .lt("processed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    await supabase
      .from("stg_rsvp_stats")
      .delete()
      .lt("processed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Insert fresh staging data
    const { data: events } = await supabase.from("events").select("id")

    if (events) {
      for (const event of events) {
        // Calculate costs
        const { data: items } = await supabase.from("items").select("estimated_cost").eq("event_id", event.id)

        const totalCost = items?.reduce((sum, item) => sum + (item.estimated_cost || 0), 0) || 0

        await supabase.from("stg_event_costs").insert({
          event_id: event.id,
          total_cost: totalCost,
          items_count: items?.length || 0,
        })

        // Calculate RSVP stats
        const { data: guests } = await supabase.from("guests").select("status").eq("event_id", event.id)

        const confirmed = guests?.filter((g) => g.status === "confirmed").length || 0
        const pending = guests?.filter((g) => g.status === "pending").length || 0
        const declined = guests?.filter((g) => g.status === "declined").length || 0

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
    await this.log("info", "Generating daily facts")

    const today = new Date().toISOString().split("T")[0]

    const { data: todayEvents } = await supabase.from("events").select("id").eq("date", today)

    const { data: todayGuests } = await supabase
      .from("guests")
      .select("id")
      .in("event_id", todayEvents?.map((e) => e.id) || [])

    const { data: todayCosts } = await supabase
      .from("stg_event_costs")
      .select("total_cost")
      .in("event_id", todayEvents?.map((e) => e.id) || [])

    const totalCost = todayCosts?.reduce((sum, cost) => sum + (cost.total_cost || 0), 0) || 0

    await supabase.from("facts_daily_events").upsert({
      date: today,
      total_events: todayEvents?.length || 0,
      total_guests: todayGuests?.length || 0,
      total_cost: totalCost,
    })

    await this.log("info", "Daily facts generated")
  }
}
