/**
 * Validação segura de autenticação para rotinas automáticas / Cron Jobs (RF-031, RNF-004).
 * Rejeita qualquer chamada caso nem CRON_SECRET nem JOBS_SECRET_TOKEN estejam configurados (evita bypass 'Bearer undefined').
 */

export function isValidCronAuthorization(
  authorizationHeader: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): boolean {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    return false
  }

  const cronSecret = (env.CRON_SECRET || "").trim()
  const jobsSecret = (env.JOBS_SECRET_TOKEN || "").trim()

  if (!cronSecret && !jobsSecret) {
    return false
  }

  if (cronSecret && authorizationHeader === `Bearer ${cronSecret}`) {
    return true
  }

  if (jobsSecret && authorizationHeader === `Bearer ${jobsSecret}`) {
    return true
  }

  return false
}

