import {
  calculateAttendanceSummary,
  calculateEventTotalCost,
  filterEffectiveGuests,
  generateSecureToken,
  isSafeToken,
  isUuid,
  normalizeItemValue,
} from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const hostViewSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  regenerateToken: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    if (!isUuid(eventId)) {
      return NextResponse.json({ error: "Identificador de evento inválido" }, { status: 400 })
    }

    const queryToken = request.nextUrl.searchParams.get("token")
    const sessionClient = await createClient()
    const {
      data: { user },
    } = await sessionClient.auth.getUser()

    const admin = createAdminClient()
    let { data: event, error } = await admin
      .from("events")
      .select("*, guests(*, guest_companions(*)), items(*)")
      .eq("id", eventId)
      .maybeSingle()

    if (error) {
      const fallback = await admin
        .from("events")
        .select("*, guests(*), items(*)")
        .eq("id", eventId)
        .maybeSingle()
      event = fallback.data as any
      error = fallback.error
    }

    if (error || !event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    const meta =
      typeof event.metadata === "object" && event.metadata !== null
        ? (event.metadata as Record<string, any>)
        : {}

    const storedToken = (event as any).host_view_token || meta.host_view_token || null
    const isEnabled = Boolean((event as any).host_view_enabled ?? meta.host_view_enabled ?? Boolean(storedToken))

    const isOwner = Boolean(user && user.id === event.user_id)
    const isTokenAuthorized = Boolean(
      isEnabled && queryToken && isSafeToken(queryToken) && storedToken && queryToken === storedToken
    )

    // RN-002 & RF-038: Exige sessão do organizador OU token dedicado do portal somente-leitura
    if (!isOwner && !isTokenAuthorized) {
      return NextResponse.json(
        { error: "Link do portal do anfitrião inválido ou desativado" },
        { status: 401 }
      )
    }

    const effectiveGuests = filterEffectiveGuests(event.guests || [])
    const attendance = calculateAttendanceSummary(effectiveGuests)
    const items = (event.items || []).map((it: any) => {
      const itMeta = typeof it.metadata === "object" && it.metadata !== null ? it.metadata : {}
      return {
        id: it.id,
        name: it.name,
        price: normalizeItemValue(it),
        category: it.category || itMeta.category || "Geral",
        paymentStatus: it.payment_status || itMeta.paymentStatus || "pending",
      }
    })

    const financialMode =
      (event as any).financial_mode ||
      meta.financial_mode ||
      (event.type === "Colaborativo" ? "collaborative_split" : "corporate_budget")

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description || "",
        financialMode,
        budgetEstimated: event.budget_estimated !== null ? Number(event.budget_estimated) : null,
        totalGuests: attendance.totalGuests,
        confirmedGuests: attendance.confirmedParticipants,
        totalCost: calculateEventTotalCost(items),
        guests: effectiveGuests.map((g: any) => ({
          id: g.id,
          name: g.name,
          status: g.status,
          dietaryRestrictions: g.dietary_restrictions || undefined,
          companions: Array.isArray(g.guest_companions)
            ? g.guest_companions.map((c: any) => ({ id: c.id, name: c.name, status: c.status }))
            : [],
        })),
        items,
      },
    })
  } catch (error) {
    console.error("Erro no host-view:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const rawBody = await request.json().catch(() => ({}))
    const parsed = hostViewSettingsSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    const sessionClient = await createClient()
    const {
      data: { user },
    } = await sessionClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: event } = await admin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    const meta =
      typeof event.metadata === "object" && event.metadata !== null
        ? (event.metadata as Record<string, any>)
        : {}

    const currentToken = (event as any).host_view_token || meta.host_view_token
    const nextToken = parsed.data.regenerateToken || !currentToken ? generateSecureToken(16) : currentToken
    const nextEnabled = parsed.data.enabled ?? true

    const nextMeta = {
      ...meta,
      host_view_token: nextToken,
      host_view_enabled: nextEnabled,
    }

    let { error } = await admin
      .from("events")
      .update({
        host_view_token: nextToken,
        host_view_enabled: nextEnabled,
        metadata: nextMeta,
      } as any)
      .eq("id", eventId)
      .eq("user_id", user.id)

    if (error) {
      await admin
        .from("events")
        .update({ metadata: nextMeta })
        .eq("id", eventId)
        .eq("user_id", user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    return NextResponse.json({
      success: true,
      enabled: nextEnabled,
      token: nextToken,
      url: `${appUrl}/event/${eventId}/host-view?token=${nextToken}`,
    })
  } catch (error) {
    console.error("Erro ao gerar link host-view:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

