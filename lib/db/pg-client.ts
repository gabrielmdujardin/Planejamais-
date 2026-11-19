import {
  type AuthUserRecord,
  getUserFromSessionToken,
  loginUserLocal,
  registerUserLocal,
  revokeSessionByToken,
} from "../auth/auth-service.ts"
import { pgQuery } from "./postgres.ts"

const ALLOWED_TABLES = new Set([
  "users",
  "user_credentials",
  "user_sessions",
  "auth_tokens",
  "events",
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
  "mv_event_costs",
  "mv_rsvp_stats",
  "event_roles",
  "event_permissions",
  "event_members",
  "event_member_permissions",
  "event_invitations",
  "event_audit_logs",
])

function assertSafeIdentifier(ident: string): string {
  const cleaned = String(ident || "").trim()
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleaned)) {
    throw new Error(`Invalid SQL identifier: ${ident}`)
  }
  return cleaned
}

function assertSafeTable(table: string): string {
  const cleaned = assertSafeIdentifier(table)
  if (!ALLOWED_TABLES.has(cleaned)) {
    throw new Error(`Table not allowed: ${table}`)
  }
  return cleaned
}

interface FilterCondition {
  sql: (paramOffset: number) => { clause: string; values: any[] }
}

class PgQueryBuilder implements PromiseLike<{ data: any; error: any; count?: number }> {
  private table: string
  private operation: "select" | "insert" | "update" | "upsert" | "delete" = "select"
  private selectSpec = "*"
  private countExact = false
  private headOnly = false
  private payload: any = null
  private upsertConflictCol?: string
  private filters: FilterCondition[] = []
  private orderSpecs: Array<{ column: string; ascending: boolean }> = []
  private limitCount?: number
  private returnSingle = false
  private returnMaybeSingle = false
  private sessionContext?: { userId?: string | null; role?: string }

  constructor(table: string, sessionContext?: { userId?: string | null; role?: string }) {
    this.table = assertSafeTable(table)
    this.sessionContext = sessionContext
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    if (this.operation === "select") {
      this.selectSpec = columns
    }
    if (options?.count === "exact") {
      this.countExact = true
    }
    if (options?.head === true) {
      this.headOnly = true
    }
    return this
  }

  insert(rows: any) {
    this.operation = "insert"
    this.payload = rows
    return this
  }

  update(values: any) {
    this.operation = "update"
    this.payload = values
    return this
  }

  upsert(rows: any, options?: { onConflict?: string }) {
    this.operation = "upsert"
    this.payload = rows
    this.upsertConflictCol = options?.onConflict
    return this
  }

  delete() {
    this.operation = "delete"
    return this
  }

  eq(column: string, value: any) {
    const col = assertSafeIdentifier(column)
    this.filters.push({
      sql: (idx) =>
        value === null
          ? { clause: `"${col}" IS NULL`, values: [] }
          : { clause: `"${col}" = $${idx}`, values: [value] },
    })
    return this
  }

  neq(column: string, value: any) {
    const col = assertSafeIdentifier(column)
    this.filters.push({
      sql: (idx) =>
        value === null
          ? { clause: `"${col}" IS NOT NULL`, values: [] }
          : { clause: `"${col}" <> $${idx}`, values: [value] },
    })
    return this
  }

  lt(column: string, value: any) {
    const col = assertSafeIdentifier(column)
    this.filters.push({
      sql: (idx) => ({ clause: `"${col}" < $${idx}`, values: [value] }),
    })
    return this
  }

  lte(column: string, value: any) {
    const col = assertSafeIdentifier(column)
    this.filters.push({
      sql: (idx) => ({ clause: `"${col}" <= $${idx}`, values: [value] }),
    })
    return this
  }

  gt(column: string, value: any) {
    const col = assertSafeIdentifier(column)
    this.filters.push({
      sql: (idx) => ({ clause: `"${col}" > $${idx}`, values: [value] }),
    })
    return this
  }

  gte(column: string, value: any) {
    const col = assertSafeIdentifier(column)
    this.filters.push({
      sql: (idx) => ({ clause: `"${col}" >= $${idx}`, values: [value] }),
    })
    return this
  }

  is(column: string, value: null | boolean) {
    const col = assertSafeIdentifier(column)
    if (value === null) {
      this.filters.push({ sql: () => ({ clause: `"${col}" IS NULL`, values: [] }) })
    } else {
      this.filters.push({ sql: () => ({ clause: `"${col}" IS ${value ? "TRUE" : "FALSE"}`, values: [] }) })
    }
    return this
  }

  in(column: string, values: any[]) {
    const col = assertSafeIdentifier(column)
    const arr = Array.isArray(values) ? values : []
    if (arr.length === 0) {
      this.filters.push({ sql: () => ({ clause: "1 = 0", values: [] }) })
      return this
    }
    this.filters.push({
      sql: (idx) => {
        const placeholders = arr.map((_, i) => `$${idx + i}`).join(", ")
        return { clause: `"${col}" IN (${placeholders})`, values: arr }
      },
    })
    return this
  }

  not(column: string, operator: string, value: any) {
    const col = assertSafeIdentifier(column)
    const op = operator.toLowerCase()
    if (op === "is" && value === null) {
      this.filters.push({ sql: () => ({ clause: `"${col}" IS NOT NULL`, values: [] }) })
    } else if (op === "eq") {
      this.neq(col, value)
    } else if (op === "in" && Array.isArray(value) && value.length > 0) {
      this.filters.push({
        sql: (idx) => {
          const placeholders = value.map((_, i) => `$${idx + i}`).join(", ")
          return { clause: `"${col}" NOT IN (${placeholders})`, values: value }
        },
      })
    }
    return this
  }

  or(expression: string) {
    // Suporte a expressões PostgREST simples como "token.eq.abc,confirmation_token.eq.abc"
    const parts = String(expression || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const parsedParts: Array<{ col: string; val: string }> = []
    for (const part of parts) {
      const m = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.eq\.(.+)$/)
      if (m) {
        parsedParts.push({ col: assertSafeIdentifier(m[1]), val: m[2] })
      }
    }

    if (parsedParts.length > 0) {
      this.filters.push({
        sql: (idx) => {
          const subClauses = parsedParts.map((p, i) => `"${p.col}" = $${idx + i}`)
          return {
            clause: `(${subClauses.join(" OR ")})`,
            values: parsedParts.map((p) => p.val),
          }
        },
      })
    }
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    const col = assertSafeIdentifier(column)
    this.orderSpecs.push({ column: col, ascending: options?.ascending !== false })
    return this
  }

  limit(count: number) {
    this.limitCount = Math.max(0, Number(count) || 0)
    return this
  }

  single() {
    this.returnSingle = true
    return this
  }

  maybeSingle() {
    this.returnMaybeSingle = true
    return this
  }

  private buildWhereClause(startIndex = 1): { whereSql: string; values: any[] } {
    if (this.filters.length === 0) {
      return { whereSql: "", values: [] }
    }
    const clauses: string[] = []
    const values: any[] = []
    let currentIdx = startIndex

    for (const f of this.filters) {
      const res = f.sql(currentIdx)
      clauses.push(res.clause)
      values.push(...res.values)
      currentIdx += res.values.length
    }

    return {
      whereSql: ` WHERE ${clauses.join(" AND ")}`,
      values,
    }
  }

  private async hydrateRelations(rows: any[]): Promise<any[]> {
    if (!rows || rows.length === 0) return rows
    const spec = this.selectSpec || ""

    // 1. Eventos com convidados, acompanhantes, itens e fotos
    if (this.table === "events") {
      const eventIds = rows.map((r) => r.id).filter(Boolean)
      if (eventIds.length === 0) return rows

      const placeholders = eventIds.map((_, i) => `$${i + 1}`).join(", ")

      if (/\bguests\b/.test(spec)) {
        const guestsRes = await pgQuery(
          `SELECT * FROM public.guests WHERE event_id IN (${placeholders}) ORDER BY created_at ASC`,
          eventIds,
          this.sessionContext
        )
        const guests = guestsRes.rows

        if (/\bguest_companions\b/.test(spec) && guests.length > 0) {
          const guestIds = guests.map((g) => g.id)
          const gPlaceholders = guestIds.map((_, i) => `$${i + 1}`).join(", ")
          const compRes = await pgQuery(
            `SELECT * FROM public.guest_companions WHERE guest_id IN (${gPlaceholders}) ORDER BY created_at ASC`,
            guestIds,
            this.sessionContext
          )
          const byGuest = new Map<string, any[]>()
          for (const c of compRes.rows) {
            const list = byGuest.get(c.guest_id) || []
            list.push(c)
            byGuest.set(c.guest_id, list)
          }
          for (const g of guests) {
            g.guest_companions = byGuest.get(g.id) || []
          }
        }

        const guestsByEvent = new Map<string, any[]>()
        for (const g of guests) {
          const list = guestsByEvent.get(g.event_id) || []
          list.push(g)
          guestsByEvent.set(g.event_id, list)
        }
        for (const ev of rows) {
          ev.guests = guestsByEvent.get(ev.id) || []
        }
      }

      if (/\bitems\b/.test(spec)) {
        const itemsRes = await pgQuery(
          `SELECT * FROM public.items WHERE event_id IN (${placeholders}) ORDER BY created_at ASC`,
          eventIds,
          this.sessionContext
        )
        const itemsByEvent = new Map<string, any[]>()
        for (const it of itemsRes.rows) {
          const list = itemsByEvent.get(it.event_id) || []
          list.push(it)
          itemsByEvent.set(it.event_id, list)
        }
        for (const ev of rows) {
          ev.items = itemsByEvent.get(ev.id) || []
        }
      }

      if (/\bevent_photos\b/.test(spec)) {
        const photosRes = await pgQuery(
          `SELECT * FROM public.event_photos WHERE event_id IN (${placeholders}) ORDER BY uploaded_at DESC`,
          eventIds,
          this.sessionContext
        )
        const photosByEvent = new Map<string, any[]>()
        for (const p of photosRes.rows) {
          const list = photosByEvent.get(p.event_id) || []
          list.push(p)
          photosByEvent.set(p.event_id, list)
        }
        for (const ev of rows) {
          ev.event_photos = photosByEvent.get(ev.id) || []
        }
      }
    }

    // 2. Convidados com acompanhantes e/ou evento pai
    if (this.table === "guests") {
      if (/\bguest_companions\b/.test(spec)) {
        const guestIds = rows.map((r) => r.id).filter(Boolean)
        if (guestIds.length > 0) {
          const placeholders = guestIds.map((_, i) => `$${i + 1}`).join(", ")
          const compRes = await pgQuery(
            `SELECT * FROM public.guest_companions WHERE guest_id IN (${placeholders}) ORDER BY created_at ASC`,
            guestIds,
            this.sessionContext
          )
          const byGuest = new Map<string, any[]>()
          for (const c of compRes.rows) {
            const list = byGuest.get(c.guest_id) || []
            list.push(c)
            byGuest.set(c.guest_id, list)
          }
          for (const g of rows) {
            g.guest_companions = byGuest.get(g.id) || []
          }
        }
      }

      if (/\bevents\b/.test(spec)) {
        const eventIds = Array.from(new Set(rows.map((r) => r.event_id).filter(Boolean)))
        if (eventIds.length > 0) {
          const placeholders = eventIds.map((_, i) => `$${i + 1}`).join(", ")
          const evRes = await pgQuery(
            `SELECT * FROM public.events WHERE id IN (${placeholders})`,
            eventIds,
            this.sessionContext
          )
          const evMap = new Map(evRes.rows.map((e) => [e.id, e]))
          for (const g of rows) {
            g.events = evMap.get(g.event_id) || null
          }
        }
      }
    }

    // 3. Itens com evento pai
    if (this.table === "items" && /\bevents\b/.test(spec)) {
      const eventIds = Array.from(new Set(rows.map((r) => r.event_id).filter(Boolean)))
      if (eventIds.length > 0) {
        const placeholders = eventIds.map((_, i) => `$${i + 1}`).join(", ")
        const evRes = await pgQuery(
          `SELECT * FROM public.events WHERE id IN (${placeholders})`,
          eventIds,
          this.sessionContext
        )
        const evMap = new Map(evRes.rows.map((e) => [e.id, e]))
        for (const it of rows) {
          it.events = evMap.get(it.event_id) || null
        }
      }
    }

    // 4. Acompanhantes com convidado e evento pai
    if (this.table === "guest_companions" && /\bguests\b/.test(spec)) {
      const guestIds = Array.from(new Set(rows.map((r) => r.guest_id).filter(Boolean)))
      if (guestIds.length > 0) {
        const placeholders = guestIds.map((_, i) => `$${i + 1}`).join(", ")
        const gRes = await pgQuery(
          `SELECT * FROM public.guests WHERE id IN (${placeholders})`,
          guestIds,
          this.sessionContext
        )
        const gMap = new Map(gRes.rows.map((g) => [g.id, g]))

        if (/\bevents\b/.test(spec)) {
          const eventIds = Array.from(new Set(gRes.rows.map((g) => g.event_id).filter(Boolean)))
          if (eventIds.length > 0) {
            const ePlaceholders = eventIds.map((_, i) => `$${i + 1}`).join(", ")
            const eRes = await pgQuery(
              `SELECT * FROM public.events WHERE id IN (${ePlaceholders})`,
              eventIds,
              this.sessionContext
            )
            const eMap = new Map(eRes.rows.map((e) => [e.id, e]))
            for (const g of gRes.rows) {
              g.events = eMap.get(g.event_id) || null
            }
          }
        }

        for (const comp of rows) {
          comp.guests = gMap.get(comp.guest_id) || null
        }
      }
    }

    return rows
  }

  private normalizeValueForPg(val: any): any {
    if (val === undefined) return null
    if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      return JSON.stringify(val)
    }
    return val
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      if (this.operation === "select") {
        const { whereSql, values } = this.buildWhereClause(1)
        let orderSql = ""
        if (this.orderSpecs.length > 0) {
          orderSql =
            " ORDER BY " +
            this.orderSpecs
              .map((o) => `"${o.column}" ${o.ascending ? "ASC" : "DESC"}`)
              .join(", ")
        }
        const limitSql =
          this.limitCount !== undefined
            ? ` LIMIT ${this.limitCount}`
            : this.returnSingle || this.returnMaybeSingle
            ? " LIMIT 1"
            : ""

        if (this.headOnly && this.countExact) {
          const countRes = await pgQuery<{ total: string }>(
            `SELECT count(*)::int AS total FROM public."${this.table}"${whereSql}`,
            values,
            this.sessionContext
          )
          return { data: null, error: null, count: Number(countRes.rows[0]?.total || 0) }
        }

        const res = await pgQuery(
          `SELECT * FROM public."${this.table}"${whereSql}${orderSql}${limitSql}`,
          values,
          this.sessionContext
        )

        const hydrated = await this.hydrateRelations(res.rows)
        const count = this.countExact ? hydrated.length : undefined

        if (this.returnSingle) {
          if (hydrated.length === 0) {
            return { data: null, error: { message: "Row not found", code: "PGRST116" }, count }
          }
          return { data: hydrated[0], error: null, count }
        }

        if (this.returnMaybeSingle) {
          return { data: hydrated[0] || null, error: null, count }
        }

        return { data: hydrated, error: null, count }
      }

      if (this.operation === "insert" || this.operation === "upsert") {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
        if (rows.length === 0) {
          return { data: [], error: null }
        }

        const insertedRows: any[] = []
        for (const row of rows) {
          const keys = Object.keys(row).filter((k) => row[k] !== undefined)
          const safeCols = keys.map((k) => `"${assertSafeIdentifier(k)}"`)
          const placeholders = keys.map((_, i) => `$${i + 1}`)
          const params = keys.map((k) => this.normalizeValueForPg(row[k]))

          let conflictClause = ""
          if (this.operation === "upsert") {
            const conflictCol = assertSafeIdentifier(
              this.upsertConflictCol || ( this.table === "facts_daily_events" ? "date" : "id")
            )
            const updateAssignments = keys
              .filter((k) => k !== conflictCol)
              .map((k) => `"${assertSafeIdentifier(k)}" = EXCLUDED."${assertSafeIdentifier(k)}"`)
            conflictClause =
              updateAssignments.length > 0
                ? ` ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updateAssignments.join(", ")}`
                : ` ON CONFLICT ("${conflictCol}") DO NOTHING`
          }

          const sql = `INSERT INTO public."${this.table}" (${safeCols.join(", ")}) VALUES (${placeholders.join(", ")})${conflictClause} RETURNING *`
          const res = await pgQuery(sql, params, this.sessionContext)
          if (res.rows[0]) {
            insertedRows.push(res.rows[0])
          }
        }

        if (this.returnSingle || this.returnMaybeSingle) {
          return { data: insertedRows[0] || null, error: null }
        }
        return { data: Array.isArray(this.payload) ? insertedRows : insertedRows, error: null }
      }

      if (this.operation === "update") {
        const updates = this.payload || {}
        const keys = Object.keys(updates).filter((k) => updates[k] !== undefined)
        if (keys.length === 0) {
          return { data: null, error: null }
        }

        const setClauses = keys.map((k, i) => `"${assertSafeIdentifier(k)}" = $${i + 1}`)
        const setValues = keys.map((k) => this.normalizeValueForPg(updates[k]))
        const { whereSql, values: whereValues } = this.buildWhereClause(keys.length + 1)

        const sql = `UPDATE public."${this.table}" SET ${setClauses.join(", ")}${whereSql} RETURNING *`
        const res = await pgQuery(sql, [...setValues, ...whereValues], this.sessionContext)

        if (this.returnSingle) {
          if (res.rows.length === 0) {
            return { data: null, error: { message: "No rows updated", code: "PGRST116" } }
          }
          return { data: res.rows[0], error: null, count: res.rowCount }
        }
        if (this.returnMaybeSingle) {
          return { data: res.rows[0] || null, error: null, count: res.rowCount }
        }
        return { data: res.rows, error: null, count: res.rowCount }
      }

      if (this.operation === "delete") {
        const { whereSql, values } = this.buildWhereClause(1)
        const sql = `DELETE FROM public."${this.table}"${whereSql} RETURNING *`
        const res = await pgQuery(sql, values, this.sessionContext)
        return { data: res.rows, error: null, count: res.rowCount }
      }

      return { data: null, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        data: null,
        error: { message },
      }
    }
  }

  then<TResult1 = { data: any; error: any; count?: number }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createLocalPgClient(options?: {
  sessionToken?: string | null
  demoUserCookie?: boolean
  role?: "authenticated" | "service_role" | "anon"
}) {
  const role = options?.role || "authenticated"

  const resolveAuthUser = async (): Promise<AuthUserRecord | null> => {
    if (options?.sessionToken) {
      const user = await getUserFromSessionToken(options.sessionToken)
      if (user) return user
    }
    if (options?.demoUserCookie) {
      const demoRes = await pgQuery(
        "SELECT * FROM public.users WHERE lower(email) = 'demo@planeja.app' LIMIT 1"
      )
      if (demoRes.rows[0]) {
        const row = demoRes.rows[0]
        return {
          id: row.id,
          email: row.email,
          name: row.name || "demo",
          phone: row.phone || "",
          location: row.location || "",
          avatar: row.avatar || undefined,
          email_verified: true,
          user_metadata: {
            name: row.name || "demo",
            phone: row.phone || "",
            location: row.location || "",
          },
        }
      }
    }
    return null
  }

  return {
    from(table: string) {
      return new PgQueryBuilder(table, { role })
    },

    async rpc(fnName: string, args: Record<string, any> = {}) {
      try {
        if (fnName === "refresh_materialized_view") {
          await pgQuery("SELECT public.refresh_materialized_view($1)", [args.view_name], {
            role: "service_role",
          })
          return { data: true, error: null }
        }
        if (fnName === "has_event_permission") {
          const res = await pgQuery<{ allowed: boolean }>(
            "SELECT public.has_event_permission($1, $2, $3, $4) AS allowed",
            [args.p_event_id, args.p_user_id, args.p_module, args.p_action]
          )
          return { data: Boolean(res.rows[0]?.allowed), error: null }
        }
        if (fnName === "transfer_event_ownership") {
          const res = await pgQuery<{ result: any }>(
            "SELECT public.transfer_event_ownership($1, $2, $3, $4) AS result",
            [
              args.p_event_id,
              args.p_actor_user_id,
              args.p_new_owner_member_id,
              args.p_confirmation_title,
            ]
          )
          return { data: res.rows[0]?.result, error: null }
        }
        return { data: null, error: { message: `RPC function ${fnName} not found` } }
      } catch (err: unknown) {
        return {
          data: null,
          error: { message: err instanceof Error ? err.message : String(err) },
        }
      }
    },

    auth: {
      async getUser() {
        try {
          const user = await resolveAuthUser()
          return { data: { user }, error: null }
        } catch (err: unknown) {
          return {
            data: { user: null },
            error: { message: err instanceof Error ? err.message : String(err) },
          }
        }
      },

      async updateUser(updates: { email?: string; data?: Record<string, any> }) {
        try {
          const user = await resolveAuthUser()
          if (!user) {
            return { data: { user: null }, error: { message: "Not authenticated" } }
          }
          const nextMeta = { ...(user.user_metadata || {}), ...(updates.data || {}) }
          await pgQuery(
            `UPDATE public.users
                SET email = coalesce($2, email),
                    name = coalesce($3, name),
                    metadata = $4
              WHERE id = $1`,
            [user.id, updates.email || null, nextMeta.name || null, JSON.stringify(nextMeta)]
          )
          return {
            data: {
              user: {
                ...user,
                email: updates.email || user.email,
                user_metadata: nextMeta,
              },
            },
            error: null,
          }
        } catch (err: unknown) {
          return {
            data: { user: null },
            error: { message: err instanceof Error ? err.message : String(err) },
          }
        }
      },

      async signInWithPassword(credentials: { email: string; password: string }) {
        try {
          const { user, sessionToken } = await loginUserLocal(credentials)
          return { data: { user, session: { access_token: sessionToken, user } }, error: null }
        } catch (err: unknown) {
          return {
            data: { user: null, session: null },
            error: { message: err instanceof Error ? err.message : String(err) },
          }
        }
      },

      async signUp(params: {
        email: string
        password: string
        options?: { data?: Record<string, any> }
      }) {
        try {
          const { user, sessionToken } = await registerUserLocal({
            email: params.email,
            password: params.password,
            name: params.options?.data?.name,
          })
          return { data: { user, session: { access_token: sessionToken, user } }, error: null }
        } catch (err: unknown) {
          return {
            data: { user: null, session: null },
            error: { message: err instanceof Error ? err.message : String(err) },
          }
        }
      },

      async signOut() {
        if (options?.sessionToken) {
          await revokeSessionByToken(options.sessionToken)
        }
        return { error: null }
      },
    },
  }
}
