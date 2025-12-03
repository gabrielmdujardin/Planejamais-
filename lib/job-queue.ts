import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface JobRun {
  id: string
  job_name: string
  status: "running" | "completed" | "failed"
  started_at: string
  completed_at?: string
  duration_ms?: number
  error_message?: string
  metadata: Record<string, any>
}

export interface JobLog {
  id: string
  job_run_id: string
  level: "info" | "warn" | "error"
  message: string
  metadata: Record<string, any>
  created_at: string
}

export class JobQueue {
  private static instance: JobQueue
  private runningJobs = new Set<string>()

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue()
    }
    return JobQueue.instance
  }

  async startJob(jobName: string, metadata: Record<string, any> = {}): Promise<string> {
    if (this.runningJobs.has(jobName)) {
      throw new Error(`Job ${jobName} is already running`)
    }

    const { data, error } = await supabase
      .from("job_runs")
      .insert({
        job_name: jobName,
        status: "running",
        metadata,
      })
      .select()
      .single()

    if (error) throw error

    this.runningJobs.add(jobName)
    return data.id
  }

  async completeJob(jobRunId: string, success = true, errorMessage?: string): Promise<void> {
    const { data: jobRun } = await supabase.from("job_runs").select("job_name, started_at").eq("id", jobRunId).single()

    if (jobRun) {
      const duration = Date.now() - new Date(jobRun.started_at).getTime()

      await supabase
        .from("job_runs")
        .update({
          status: success ? "completed" : "failed",
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          error_message: errorMessage,
        })
        .eq("id", jobRunId)

      this.runningJobs.delete(jobRun.job_name)
    }
  }

  async logMessage(
    jobRunId: string,
    level: "info" | "warn" | "error",
    message: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    await supabase.from("job_logs").insert({
      job_run_id: jobRunId,
      level,
      message,
      metadata,
    })
  }

  async getRecentJobs(limit = 50): Promise<JobRun[]> {
    const { data, error } = await supabase
      .from("job_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async getJobLogs(jobRunId: string): Promise<JobLog[]> {
    const { data, error } = await supabase
      .from("job_logs")
      .select("*")
      .eq("job_run_id", jobRunId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  }
}
