import {
  changePasswordLocal,
  deleteUserAccountLocal,
  getUserFromSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-service"
import { pgQuery } from "@/lib/db/postgres"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const user = await getUserFromSessionToken(token)

  if (!user) {
    return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
  }

  return NextResponse.json({ user, authenticated: true }, { status: 200 })
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const user = await getUserFromSessionToken(token)

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body = await request.json()

  if (body.action === "change_password") {
    const res = await changePasswordLocal({
      userId: user.id,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    })
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: "Senha alterada com sucesso." })
  }

  const nextName = body.name !== undefined ? String(body.name).trim() : user.name
  const nextPhone = body.phone !== undefined ? String(body.phone).trim() : user.phone || ""
  const nextLocation = body.location !== undefined ? String(body.location).trim() : user.location || ""
  const nextAvatar = body.avatar !== undefined ? body.avatar : user.avatar || null

  const updated = await pgQuery(
    `UPDATE public.users
        SET name = $2,
            phone = $3,
            location = $4,
            avatar = $5
      WHERE id = $1
      RETURNING *`,
    [user.id, nextName, nextPhone, nextLocation, nextAvatar]
  )

  return NextResponse.json({
    user: {
      ...user,
      name: updated.rows[0]?.name || nextName,
      phone: updated.rows[0]?.phone || nextPhone,
      location: updated.rows[0]?.location || nextLocation,
      avatar: updated.rows[0]?.avatar || undefined,
    },
  })
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const user = await getUserFromSessionToken(token)

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  await deleteUserAccountLocal(user.id)

  const response = NextResponse.json({
    success: true,
    message: "Conta e dados vinculados excluídos permanentemente (LGPD).",
  })
  response.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 })
  return response
}
