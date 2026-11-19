/**
 * PLANEJA+ — UTILITÁRIO DE BACKUP, RESTAURAÇÃO E MIGRAÇÃO DO POSTGRESQL LOCAL
 *
 * Modos:
 *   node scripts/db-backup-restore.mjs backup [--out=database/backups/backup.sql]
 *   node scripts/db-backup-restore.mjs restore --in=database/backups/backup.sql [--isolated=true]
 */

import fs from "node:fs"
import path from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto"
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp"
import { ensurePostgresInitialized, pgQuery } from "../lib/db/postgres.ts"

const EXPORT_TABLES = [
  "users",
  "user_credentials",
  "events",
  "event_members",
  "event_member_permissions",
  "event_invitations",
  "event_audit_logs",
  "guests",
  "guest_companions",
  "items",
  "event_photos",
  "contacts",
  "contact_lists",
  "stored_files",
  "email_outbox",
  "job_runs",
  "job_logs",
  "stg_event_costs",
  "stg_rsvp_stats",
  "facts_daily_events",
]

function formatSqlValue(val) {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE"
  if (typeof val === "number") return Number.isFinite(val) ? String(val) : "NULL"
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'"
    const escapedItems = val.map((item) => `"${String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    return `'{${escapedItems.join(",")}}'`
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  }
  return `'${String(val).replace(/'/g, "''")}'`
}

export async function generateDatabaseBackupSql(outputPath) {
  await ensurePostgresInitialized()

  const lines = [
    "-- =============================================================================",
    `-- PLANEJA+ POSTGRESQL BACKUP (planeja_plus) — Gerado em ${new Date().toISOString()}`,
    "-- =============================================================================",
    "BEGIN;",
    "",
  ]

  const counts = {}

  for (const table of EXPORT_TABLES) {
    const res = await pgQuery(`SELECT * FROM public."${table}"`)
    counts[table] = res.rows.length
    if (res.rows.length === 0) continue

    lines.push(`-- Tabela: public.${table} (${res.rows.length} registros)`)
    for (const row of res.rows) {
      const cols = Object.keys(row)
      const colNames = cols.map((c) => `"${c}"`).join(", ")
      const colValues = cols.map((c) => formatSqlValue(row[c])).join(", ")
      lines.push(
        `INSERT INTO public."${table}" (${colNames}) VALUES (${colValues}) ON CONFLICT DO NOTHING;`
      )
    }
    lines.push("")
  }

  lines.push("COMMIT;")
  const sqlContent = lines.join("\n")

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, sqlContent, "utf8")
  }

  return { sqlContent, counts, outputPath }
}

export async function verifyRestoreInIsolatedDatabase(sqlDumpContent) {
  const isolatedDb = await PGlite.create({
    extensions: { pgcrypto, uuid_ossp },
  })

  const m1 = fs.readFileSync(path.resolve("database/migrations/001_init_planeja_plus.sql"), "utf8")
  const m2 = fs.readFileSync(path.resolve("database/migrations/002_rbac_and_collaboration.sql"), "utf8")

  await isolatedDb.exec(m1)
  await isolatedDb.exec(m2)
  await isolatedDb.exec(sqlDumpContent)

  const restoredCounts = {}
  for (const table of EXPORT_TABLES) {
    const res = await isolatedDb.query(`SELECT count(*)::int AS total FROM public."${table}"`)
    restoredCounts[table] = Number(res.rows[0]?.total || 0)
  }

  await isolatedDb.close()
  return { success: true, restoredCounts }
}

async function runCli() {
  const action = process.argv[2]
  if (!action) return

  const args = Object.fromEntries(
    process.argv.slice(3).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=")
      return [k, v ?? "true"]
    })
  )

  if (action === "backup") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const out = args.out || path.resolve("database", "backups", `planeja_plus_${timestamp}.sql`)
    const result = await generateDatabaseBackupSql(out)
    console.log(JSON.stringify({ status: "ok", backupFile: result.outputPath, counts: result.counts }, null, 2))
  } else if (action === "restore") {
    const inFile = args.in
    if (!inFile || !fs.existsSync(inFile)) {
      console.error("Arquivo de backup não encontrado:", inFile)
      process.exit(1)
    }
    const sql = fs.readFileSync(inFile, "utf8")
    const verify = await verifyRestoreInIsolatedDatabase(sql)
    console.log(JSON.stringify({ status: "ok", isolatedVerification: verify }, null, 2))
  }
}

if (process.argv[1] && process.argv[1].endsWith("db-backup-restore.mjs")) {
  runCli().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
