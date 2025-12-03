import { JobQueue } from "./job-queue"

export abstract class BaseJob {
  protected queue = JobQueue.getInstance()
  protected jobRunId?: string

  abstract getName(): string
  abstract execute(): Promise<void>

  async run(): Promise<void> {
    try {
      this.jobRunId = await this.queue.startJob(this.getName())
      await this.log("info", `Starting job ${this.getName()}`)

      await this.execute()

      await this.log("info", `Job ${this.getName()} completed successfully`)
      await this.queue.completeJob(this.jobRunId, true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      await this.log("error", `Job ${this.getName()} failed: ${errorMessage}`)

      if (this.jobRunId) {
        await this.queue.completeJob(this.jobRunId, false, errorMessage)
      }

      throw error
    }
  }

  protected async log(
    level: "info" | "warn" | "error",
    message: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    if (this.jobRunId) {
      await this.queue.logMessage(this.jobRunId, level, message, metadata)
    }
  }
}
