import { createLocalPgClient } from "../db/pg-client.ts"

/**
 * Cliente administrativo de banco de dados conectado ao PostgreSQL local (planeja_plus)
 * com privilégio service_role para rotas públicas tokenizadas, jobs e migrações.
 */
export function createAdminClient() {
  return createLocalPgClient({
    role: "service_role",
  })
}
