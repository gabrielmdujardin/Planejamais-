import { BaseJob } from "../lib/job-runner.ts"

export class CleanupJob extends BaseJob {
  getName(): string {
    return "cleanup"
  }

  async execute(): Promise<void> {
    await this.log("info", "Starting cleanup tasks")

    await this.cleanupOldJobRuns()
    await this.cleanupOldJobLogs()
    await this.cleanupStagingTables()
    await this.expireOverdueInvites()

    await this.log("info", "Cleanup tasks completed")
  }

  private async cleanupOldJobRuns(): Promise<void> {
    const supabase = this.getSupabase()
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const { count } = await supabase.from("job_runs").delete().lt("started_at", cutoffDate.toISOString())
    await this.log("info", `Cleaned up ${count || 0} old job runs`)
  }

  private async cleanupOldJobLogs(): Promise<void> {
    const supabase = this.getSupabase()
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const { count } = await supabase.from("job_logs").delete().lt("created_at", cutoffDate.toISOString())
    await this.log("info", `Cleaned up ${count || 0} old job logs`)
  }

  private async cleanupStagingTables(): Promise<void> {
    const supabase = this.getSupabase()
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    await supabase.from("stg_event_costs").delete().lt("processed_at", cutoffDate.toISOString())
    await supabase.from("stg_rsvp_stats").delete().lt("processed_at", cutoffDate.toISOString())

    await this.log("info", "Cleaned up staging tables")
  }

  /**
   * RN-002 & RN-006: Eventos pertencem exclusivamente ao organizador e nunca são excluídos automaticamente;
   * a rotina expira apenas convites pendentes cujo prazo de confirmação já venceu.
   */
  private async expireOverdueInvites(): Promise<void> {
    const supabase = this.getSupabase()
    const nowIso = new Date().toISOString()

    const { count } = await supabase
      .from("guests")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("confirmation_deadline", nowIso)

    await this.log("info", `Marked ${count || 0} overdue invites as expired`)
  }
}
