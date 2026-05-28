import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type EventSnapshot = {
  id?: string
  title?: string
  type?: string
  category?: string
  date?: string
  time?: string
  fullDate?: string
  location?: string
  description?: string
  confirmedGuests?: number
  totalGuests?: number
}

function buildPublicUrl(request: NextRequest, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  return `${appUrl}/convite/${token}`
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function publicInviteColumnsMissing(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || error?.code === "PGRST204" || error?.message?.includes("public_invite")
}

function migrationError() {
  return NextResponse.json(
    {
      error:
        "As colunas do convite público ainda não existem no Supabase. Execute a migration 20260527000100_public_invite_flow.sql e tente novamente.",
    },
    { status: 500 }
  )
}

function envError() {
  return NextResponse.json(
    { error: "Supabase não está configurado. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
    { status: 500 }
  )
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

async function findEvent(admin: ReturnType<typeof createAdminClient>, eventId: string, userId: string) {
  const baseSelect = "id, user_id, public_invite_token, public_invite_enabled"

  if (isUuid(eventId)) {
    const result = await admin
      .from("events")
      .select(baseSelect)
      .eq("id", eventId)
      .eq("user_id", userId)
      .maybeSingle()

    if (publicInviteColumnsMissing(result.error)) throw new Error("PUBLIC_INVITE_COLUMNS_MISSING")
    if (result.data) return result.data
  }

  const result = await admin
    .from("events")
    .select(baseSelect)
    .eq("metadata->>local_event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle()

  if (publicInviteColumnsMissing(result.error)) throw new Error("PUBLIC_INVITE_COLUMNS_MISSING")
  if (result.error) throw result.error

  return result.data
}

async function createEventFromSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
  userId: string,
  snapshot?: EventSnapshot
) {
  if (!snapshot?.title) return null

  const { data, error } = await admin
    .from("events")
    .insert({
      user_id: userId,
      title: snapshot.title,
      type: snapshot.type || "Evento",
      category: snapshot.category || null,
      date: snapshot.date || new Date().toISOString(),
      time: snapshot.time || "",
      full_date: snapshot.fullDate || null,
      location: snapshot.location || "",
      description: snapshot.description || "",
      confirmed_guests: snapshot.confirmedGuests || 0,
      total_guests: snapshot.totalGuests || 0,
      metadata: { local_event_id: eventId },
    })
    .select("id, user_id, public_invite_token, public_invite_enabled")
    .single()

  if (publicInviteColumnsMissing(error)) throw new Error("PUBLIC_INVITE_COLUMNS_MISSING")
  if (error) throw error

  return data
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()
    const event = await findEvent(admin, eventId, user.id)

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado no Supabase" }, { status: 404 })
    }

    return NextResponse.json({
      token: event.public_invite_token,
      enabled: event.public_invite_enabled,
      url: event.public_invite_token ? buildPublicUrl(request, event.public_invite_token) : null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "PUBLIC_INVITE_COLUMNS_MISSING") return migrationError()
    if (error instanceof Error && (error.message === "Missing Supabase environment variables" || error.message.includes("supabaseUrl"))) return envError()
    console.error("Erro ao buscar link público:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    const body = await request.json().catch(() => ({}))
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()
    let event = await findEvent(admin, eventId, user.id)

    if (!event) {
      event = await createEventFromSnapshot(admin, eventId, user.id, body.event)
    }

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado no Supabase. Salve o evento antes de gerar o link público." },
        { status: 404 }
      )
    }

    const token = event.public_invite_token || crypto.randomUUID()
    const { data: updated, error: updateError } = await admin
      .from("events")
      .update({
        public_invite_token: token,
        public_invite_enabled: true,
      })
      .eq("id", event.id)
      .eq("user_id", user.id)
      .select("public_invite_token, public_invite_enabled")
      .single()

    if (publicInviteColumnsMissing(updateError)) return migrationError()
    if (updateError || !updated) throw updateError

    return NextResponse.json({
      token: updated.public_invite_token,
      enabled: updated.public_invite_enabled,
      url: buildPublicUrl(request, updated.public_invite_token),
    })
  } catch (error) {
    if (error instanceof Error && error.message === "PUBLIC_INVITE_COLUMNS_MISSING") return migrationError()
    if (error instanceof Error && (error.message === "Missing Supabase environment variables" || error.message.includes("supabaseUrl"))) return envError()
    console.error("Erro ao gerar link público:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    const { enabled } = await request.json()
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()
    const event = await findEvent(admin, eventId, user.id)

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado no Supabase" }, { status: 404 })
    }

    const { data: updated, error } = await admin
      .from("events")
      .update({ public_invite_enabled: Boolean(enabled) })
      .eq("id", event.id)
      .eq("user_id", user.id)
      .select("public_invite_token, public_invite_enabled")
      .single()

    if (publicInviteColumnsMissing(error)) return migrationError()
    if (error || !updated) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      token: updated.public_invite_token,
      enabled: updated.public_invite_enabled,
      url: updated.public_invite_token ? buildPublicUrl(request, updated.public_invite_token) : null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "PUBLIC_INVITE_COLUMNS_MISSING") return migrationError()
    if (error instanceof Error && (error.message === "Missing Supabase environment variables" || error.message.includes("supabaseUrl"))) return envError()
    console.error("Erro ao atualizar link público:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
