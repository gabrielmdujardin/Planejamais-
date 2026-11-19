import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto"
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp"
import pg from "pg"
import { hashPassword } from "../auth/password.ts"

const { Pool } = pg

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
}

export interface PostgresDriverInfo {
  mode: "tcp-postgres" | "embedded-postgres16"
  database: string
  connected: boolean
  version: string
  migrationsApplied: boolean
}

let tcpPool: pg.Pool | null = null
let pgliteInstance: PGlite | null = null
let activeMode: "tcp-postgres" | "embedded-postgres16" | null = null
let initPromise: Promise<void> | null = null
let migrationsApplied = false

function parseHostPortFromUrl(urlStr: string): { host: string; port: number } {
  try {
    const parsed = new URL(urlStr)
    return {
      host: parsed.hostname || "127.0.0.1",
      port: Number(parsed.port || 5432),
    }
  } catch {
    return { host: "127.0.0.1", port: 5432 }
  }
}

function checkTcpPortReachable(host: string, port: number, timeoutMs = 600): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once("connect", () => finish(true))
    socket.once("timeout", () => finish(false))
    socket.once("error", () => finish(false))
    socket.connect(port, host)
  })
}

async function applySqlMigrations(execSql: (sql: string) => Promise<void>, queryFn: (sql: string, params?: any[]) => Promise<QueryResult>) {
  if (migrationsApplied) return

  const migrationsDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "database", "migrations")
  const seedsDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "database", "seeds")

  const migrationFiles = ["001_init_planeja_plus.sql", "002_rbac_and_collaboration.sql"]
  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file)
    if (fs.existsSync(fullPath)) {
      const sql = fs.readFileSync(fullPath, "utf8")
      await execSql(sql)
    }
  }

  const seedFile = path.join(seedsDir, "001_demo_seed.sql")
  if (fs.existsSync(seedFile)) {
    const sql = fs.readFileSync(seedFile, "utf8")
    await execSql(sql)
  }

  // Garantir credencial Argon2id/Scrypt para o usuário demo@planeja.app
  const demoUserId = "00000000-0000-4000-8000-000000000001"
  const existingCred = await queryFn(
    "SELECT user_id FROM public.user_credentials WHERE user_id = $1",
    [demoUserId]
  )
  if (existingCred.rows.length === 0) {
    const demoHash = hashPassword("demo123")
    await queryFn(
      `INSERT INTO public.user_credentials (user_id, password_hash, algorithm)
       VALUES ($1, $2, 'scrypt-argon2id')
       ON CONFLICT (user_id) DO NOTHING`,
      [demoUserId, demoHash]
    )
  }

  migrationsApplied = true
}

export async function ensurePostgresInitialized(): Promise<void> {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    const dbUrl =
      process.env.DATABASE_URL ||
      "postgresql://planeja:planeja_local_2026@127.0.0.1:5432/planeja_plus"

    const forceEmbedded = process.env.PG_EMBEDDED === "true"
    const { host, port } = parseHostPortFromUrl(dbUrl)
    const tcpReachable = !forceEmbedded && (await checkTcpPortReachable(host, port))

    if (tcpReachable) {
      try {
        const pool = new Pool({
          connectionString: dbUrl,
          max: 15,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 3_000,
        })
        await pool.query("SELECT 1")
        tcpPool = pool
        activeMode = "tcp-postgres"

        await applySqlMigrations(
          async (sql) => {
            await pool.query(sql)
          },
          async (sql, params = []) => {
            const res = await pool.query(sql, params)
            return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length }
          }
        )
        return
      } catch {
        tcpPool = null
      }
    }

    // Inicializa motor PostgreSQL 16 real embarcado (PGlite) com persistência em disco
    const useMemory = process.env.PGLITE_MEMORY === "true"
    const dataDir = useMemory
      ? undefined
      : process.env.PGLITE_DATA_DIR || path.resolve(/*turbopackIgnore: true*/ process.cwd(), "storage", "pgdata-local")

    if (dataDir) {
      fs.mkdirSync(path.dirname(dataDir), { recursive: true })
    }

    pgliteInstance = await PGlite.create({
      dataDir,
      extensions: {
        pgcrypto,
        uuid_ossp,
      },
    })
    activeMode = "embedded-postgres16"

    await applySqlMigrations(
      async (sql) => {
        await pgliteInstance!.exec(sql)
      },
      async (sql, params = []) => {
        const res = await pgliteInstance!.query(sql, params)
        return { rows: res.rows as any[], rowCount: res.affectedRows ?? res.rows.length }
      }
    )
  })()

  return initPromise
}

/**
 * Executa uma consulta SQL parametrizada no PostgreSQL local (planeja_plus).
 */
export async function pgQuery<T = any>(
  sql: string,
  params: any[] = [],
  sessionContext?: { userId?: string | null; role?: string }
): Promise<QueryResult<T>> {
  await ensurePostgresInitialized()

  if (activeMode === "tcp-postgres" && tcpPool) {
    if (sessionContext?.userId) {
      const client = await tcpPool.connect()
      try {
        await client.query("BEGIN")
        await client.query("SELECT set_config('app.current_user_id', $1, true)", [sessionContext.userId])
        await client.query("SELECT set_config('app.current_role', $1, true)", [
          sessionContext.role || "authenticated",
        ])
        const res = await client.query(sql, params)
        await client.query("COMMIT")
        return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length }
      } catch (err) {
        await client.query("ROLLBACK")
        throw err
      } finally {
        client.release()
      }
    }
    const res = await tcpPool.query(sql, params)
    return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length }
  }

  if (pgliteInstance) {
    if (sessionContext?.userId !== undefined) {
      await pgliteInstance.query("SELECT set_config('app.current_user_id', $1, false)", [
        sessionContext.userId || "",
      ])
      await pgliteInstance.query("SELECT set_config('app.current_role', $1, false)", [
        sessionContext.role || "authenticated",
      ])
    }
    const res = await pgliteInstance.query<T>(sql, params)
    return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length }
  }

  throw new Error("PostgreSQL engine is not initialized")
}

/**
 * Executa múltiplas operações SQL dentro de uma transação ACID atômica (BEGIN / COMMIT / ROLLBACK).
 */
export async function withPgTransaction<T>(
  callback: (txQuery: <R = any>(sql: string, params?: any[]) => Promise<QueryResult<R>>) => Promise<T>
): Promise<T> {
  await ensurePostgresInitialized()

  if (activeMode === "tcp-postgres" && tcpPool) {
    const client = await tcpPool.connect()
    try {
      await client.query("BEGIN")
      const result = await callback(async <R = any>(sql: string, params: any[] = []) => {
        const res = await client.query(sql, params)
        return { rows: res.rows as R[], rowCount: res.rowCount ?? res.rows.length }
      })
      await client.query("COMMIT")
      return result
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  }

  if (pgliteInstance) {
    return pgliteInstance.transaction(async (tx) => {
      return callback(async <R = any>(sql: string, params: any[] = []) => {
        const res = await tx.query<R>(sql, params)
        return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length }
      })
    })
  }

  throw new Error("PostgreSQL engine is not initialized")
}

export async function getPostgresHealth(): Promise<PostgresDriverInfo> {
  await ensurePostgresInitialized()
  const ver = await pgQuery<{ version: string }>("SELECT version() AS version")
  return {
    mode: activeMode || "embedded-postgres16",
    database: process.env.POSTGRES_DB || "planeja_plus",
    connected: true,
    version: ver.rows[0]?.version || "PostgreSQL 16",
    migrationsApplied,
  }
}
