import { BaseJob } from "../lib/job-runner"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export class CleanupJob extends BaseJob {
  getName(): string {
    return "cleanup"
  }

  async execute(): Promise<void> {
    await this.log("info", "Starting cleanup tasks")

    await this.cleanupOldJobRuns()
    await this.cleanupOldJobLogs()
    await this.cleanupStagingTables()
    await this.cleanupExpiredEvents()

    await this.log("info", "Cleanup tasks completed")
  }

  private async cleanupOldJobRuns(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    const { count } = await supabase.from("job_runs").delete().lt("started_at", cutoffDate.toISOString())

    await this.log("info", `Cleaned up ${count || 0} old job runs`)
  }

  private async cleanupOldJobLogs(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    const { count } = await supabase.from("job_logs").delete().lt("created_at", cutoffDate.toISOString())

    await this.log("info", `Cleaned up ${count || 0} old job logs`)
  }

  private async cleanupStagingTables(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

    await supabase.from("stg_event_costs").delete().lt("processed_at", cutoffDate.toISOString())
    await supabase.from("stg_rsvp_stats").delete().lt("processed_at", cutoffDate.toISOString())

    await this.log("info", "Cleaned up staging tables")
  }

  private async cleanupExpiredEvents(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago

    const { count } = await supabase.from("events").delete().lt("date", cutoffDate.toISOString().split("T")[0])

    await this.log("info", `Cleaned up ${count || 0} expired events`)
  }
}
