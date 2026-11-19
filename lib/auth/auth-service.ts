import crypto from "node:crypto"
import { EmailService } from "../../src/services/email.service.ts"
import { pgQuery, withPgTransaction } from "../db/postgres.ts"
import {
  generateAuthToken,
  hashPassword,
  hashTokenSha256,
  signSessionJwt,
  verifyPassword,
  verifySessionJwt,
} from "./password.ts"

export const SESSION_COOKIE_NAME = "planeja_session_token"
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutos

export interface AuthUserRecord {
  id: string
  email: string
  name: string
  phone?: string
  location?: string
  avatar?: string
  email_verified?: boolean
  user_metadata: Record<string, any>
}

function rowToAuthUser(row: any): AuthUserRecord {
  const meta = typeof row.metadata === "object" && row.metadata !== null ? row.metadata : {}
  return {
    id: row.id,
    email: row.email,
    name: row.name || meta.name || row.email.split("@")[0] || "Usuário",
    phone: row.phone || meta.phone || "",
    location: row.location || meta.location || "",
    avatar: row.avatar || meta.avatar_url || undefined,
    email_verified: Boolean(row.email_verified),
    user_metadata: {
      ...meta,
      name: row.name || meta.name || row.email.split("@")[0],
      full_name: row.name || meta.full_name || row.email.split("@")[0],
      phone: row.phone || meta.phone || "",
      location: row.location || meta.location || "",
      avatar_url: row.avatar || meta.avatar_url || undefined,
    },
  }
}

/**
 * 1. Cadastro real de usuário no PostgreSQL local (RF-001, RN-001, Seção 7).
 */
export async function registerUserLocal(params: {
  email: string
  password: string
  name?: string
  phone?: string
  location?: string
  ipAddress?: string
  userAgent?: string
}): Promise<{
  user: AuthUserRecord
  sessionToken: string
  verificationToken: string
}> {
  const email = String(params.email || "").trim().toLowerCase()
  const password = String(params.password || "")
  const name = String(params.name || email.split("@")[0] || "Usuário").trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe um endereço de e-mail válido.")
  }
  if (password.length < 6) {
    throw new Error("A senha deve ter no mínimo 6 caracteres.")
  }

  const existing = await pgQuery("SELECT id FROM public.users WHERE lower(email) = $1", [email])
  if (existing.rows.length > 0) {
    throw new Error("Já existe uma conta cadastrada com este endereço de e-mail (RN-001).")
  }

  const passwordHash = hashPassword(password)
  const verificationRawToken = generateAuthToken(32)
  const verificationHash = hashTokenSha256(verificationRawToken)
  const sessionRawToken = generateAuthToken(32)
  const sessionHash = hashTokenSha256(sessionRawToken)
  const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const { userRow, sessionId } = await withPgTransaction(async (txQuery) => {
    const uRes = await txQuery(
      `INSERT INTO public.users (email, name, phone, location, email_verified, metadata)
       VALUES ($1, $2, $3, $4, false, $5)
       RETURNING *`,
      [
        email,
        name,
        params.phone || "",
        params.location || "",
        JSON.stringify({ name, phone: params.phone || "", location: params.location || "" }),
      ]
    )
    const createdUser = uRes.rows[0]

    await txQuery(
      `INSERT INTO public.user_credentials (user_id, password_hash, algorithm)
       VALUES ($1, $2, 'scrypt-argon2id')`,
      [createdUser.id, passwordHash]
    )

    await txQuery(
      `INSERT INTO public.auth_tokens (user_id, email, token_hash, token_type, expires_at)
       VALUES ($1, $2, $3, 'email_verification', $4)`,
      [createdUser.id, email, verificationHash, verifyExpiresAt.toISOString()]
    )

    const sRes = await txQuery(
      `INSERT INTO public.user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        createdUser.id,
        sessionHash,
        params.ipAddress || "127.0.0.1",
        params.userAgent || "Planeja+ Client",
        sessionExpiresAt.toISOString(),
      ]
    )

    return { userRow: createdUser, sessionId: sRes.rows[0].id as string }
  })

  // Disparo assíncrono do e-mail de confirmação de cadastro (Mailpit local ou SMTP real)
  await EmailService.sendRegistrationConfirmationEmail({
    to: email,
    userName: name,
    verificationToken: verificationRawToken,
    expiresInHours: 24,
  }).catch(() => {})

  const user = rowToAuthUser(userRow)
  const sessionToken = signSessionJwt({
    sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    exp: sessionExpiresAt.getTime(),
  })

  return {
    user,
    sessionToken,
    verificationToken: verificationRawToken,
  }
}

/**
 * 2. Login real com proteção contra força bruta e bloqueio temporário (RF-002, RNF-004, Seção 7).
 */
export async function loginUserLocal(params: {
  email: string
  password: string
  ipAddress?: string
  userAgent?: string
}): Promise<{
  user: AuthUserRecord
  sessionToken: string
}> {
  const email = String(params.email || "").trim().toLowerCase()
  const password = String(params.password || "")

  const userRes = await pgQuery(
    `SELECT u.*, c.password_hash, c.failed_login_attempts, c.locked_until, c.requires_password_reset
       FROM public.users u
       LEFT JOIN public.user_credentials c ON c.user_id = u.id
      WHERE lower(u.email) = $1
      LIMIT 1`,
    [email]
  )

  if (userRes.rows.length === 0) {
    throw new Error("E-mail ou senha inválidos.")
  }

  const row = userRes.rows[0]

  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    const minutesLeft = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 60_000)
    throw new Error(
      `Conta temporariamente bloqueada por excesso de tentativas. Aguarde ${minutesLeft} minuto(s).`
    )
  }

  if (row.requires_password_reset || !row.password_hash) {
    throw new Error("Esta conta requer redefinição de senha. Utilize a opção 'Esqueci minha senha'.")
  }

  const valid = verifyPassword(password, row.password_hash)
  if (!valid) {
    const attempts = Number(row.failed_login_attempts || 0) + 1
    const lockUntil =
      attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
        : null

    await pgQuery(
      `UPDATE public.user_credentials
          SET failed_login_attempts = $2,
              locked_until = $3
        WHERE user_id = $1`,
      [row.id, attempts, lockUntil]
    )
    throw new Error("E-mail ou senha inválidos.")
  }

  await pgQuery(
    `UPDATE public.user_credentials
        SET failed_login_attempts = 0,
            locked_until = NULL
      WHERE user_id = $1`,
    [row.id]
  )

  const sessionRaw = generateAuthToken(32)
  const sessionHash = hashTokenSha256(sessionRaw)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const sessionRes = await pgQuery<{ id: string }>(
    `INSERT INTO public.user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      row.id,
      sessionHash,
      params.ipAddress || "127.0.0.1",
      params.userAgent || "Planeja+ Client",
      expiresAt.toISOString(),
    ]
  )

  const user = rowToAuthUser(row)
  const sessionToken = signSessionJwt({
    sessionId: sessionRes.rows[0].id,
    userId: user.id,
    email: user.email,
    name: user.name,
    exp: expiresAt.getTime(),
  })

  return { user, sessionToken }
}

/**
 * 3. Valida token de sessão (JWT + verificação de sessão ativa e não revogada no PostgreSQL).
 */
export async function getUserFromSessionToken(
  token: string | undefined | null
): Promise<AuthUserRecord | null> {
  const verified = verifySessionJwt(token)
  if (!verified.valid || !verified.payload) {
    return null
  }

  const { sessionId, userId } = verified.payload
  const res = await pgQuery(
    `SELECT u.*
       FROM public.user_sessions s
       JOIN public.users u ON u.id = s.user_id
      WHERE s.id = $1
        AND s.user_id = $2
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
      LIMIT 1`,
    [sessionId, userId]
  )

  if (res.rows.length === 0) {
    return null
  }

  return rowToAuthUser(res.rows[0])
}

/**
 * 4. Revoga sessão no logout (RF-003, Seção 7).
 */
export async function revokeSessionByToken(token: string | undefined | null): Promise<boolean> {
  const verified = verifySessionJwt(token)
  if (!verified.valid || !verified.payload) {
    return false
  }

  await pgQuery(
    `UPDATE public.user_sessions
        SET revoked_at = now()
      WHERE id = $1`,
    [verified.payload.sessionId]
  )
  return true
}

/**
 * 5. Confirmação de e-mail mediante token único (Seção 7).
 */
export async function confirmEmailWithToken(rawToken: string): Promise<{
  success: boolean
  email?: string
  error?: string
}> {
  const tokenHash = hashTokenSha256(rawToken)
  const tokenRes = await pgQuery(
    `SELECT *
       FROM public.auth_tokens
      WHERE token_hash = $1
        AND token_type = 'email_verification'
        AND consumed_at IS NULL
        AND expires_at > now()
      LIMIT 1`,
    [tokenHash]
  )

  if (tokenRes.rows.length === 0) {
    return { success: false, error: "Token de confirmação inválido ou expirado." }
  }

  const tok = tokenRes.rows[0]
  await withPgTransaction(async (txQuery) => {
    await txQuery(
      `UPDATE public.auth_tokens SET consumed_at = now() WHERE id = $1`,
      [tok.id]
    )
    await txQuery(
      `UPDATE public.users
          SET email_verified = true,
              email_verified_at = now()
        WHERE id = $1`,
      [tok.user_id]
    )
  })

  return { success: true, email: tok.email }
}

/**
 * 6. Solicitação de recuperação de senha (Seção 7 e 8).
 */
export async function requestPasswordRecoveryLocal(emailInput: string): Promise<{
  success: boolean
  resetToken?: string
}> {
  const email = String(emailInput || "").trim().toLowerCase()
  const userRes = await pgQuery("SELECT * FROM public.users WHERE lower(email) = $1 LIMIT 1", [email])

  if (userRes.rows.length === 0) {
    // Retorna sucesso genérico para evitar enumeração de contas
    return { success: true }
  }

  const user = userRes.rows[0]
  const resetRaw = generateAuthToken(32)
  const resetHash = hashTokenSha256(resetRaw)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 60 minutos

  await pgQuery(
    `INSERT INTO public.auth_tokens (user_id, email, token_hash, token_type, expires_at)
     VALUES ($1, $2, $3, 'password_reset', $4)`,
    [user.id, user.email, resetHash, expiresAt.toISOString()]
  )

  await EmailService.sendPasswordRecoveryEmail({
    to: user.email,
    userName: user.name || user.email,
    resetToken: resetRaw,
    expiresInMinutes: 60,
  }).catch(() => {})

  return { success: true, resetToken: resetRaw }
}

/**
 * 7. Redefinição de senha com token de recuperação e revogação de sessões ativas (Seção 7).
 */
export async function resetPasswordWithTokenLocal(params: {
  resetToken: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  if (!params.newPassword || params.newPassword.length < 6) {
    return { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." }
  }

  const tokenHash = hashTokenSha256(params.resetToken)
  const tokRes = await pgQuery(
    `SELECT t.*, u.name, u.email AS user_email
       FROM public.auth_tokens t
       JOIN public.users u ON u.id = t.user_id
      WHERE t.token_hash = $1
        AND t.token_type = 'password_reset'
        AND t.consumed_at IS NULL
        AND t.expires_at > now()
      LIMIT 1`,
    [tokenHash]
  )

  if (tokRes.rows.length === 0) {
    return { success: false, error: "Token de recuperação inválido ou expirado." }
  }

  const tok = tokRes.rows[0]
  const newHash = hashPassword(params.newPassword)

  await withPgTransaction(async (txQuery) => {
    await txQuery(`UPDATE public.auth_tokens SET consumed_at = now() WHERE id = $1`, [tok.id])
    await txQuery(
      `INSERT INTO public.user_credentials (user_id, password_hash, algorithm, failed_login_attempts, locked_until, requires_password_reset, password_changed_at)
       VALUES ($1, $2, 'scrypt-argon2id', 0, NULL, false, now())
       ON CONFLICT (user_id) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             failed_login_attempts = 0,
             locked_until = NULL,
             requires_password_reset = false,
             password_changed_at = now()`,
      [tok.user_id, newHash]
    )
    // Revoga todas as sessões anteriores ao redefinir a senha
    await txQuery(
      `UPDATE public.user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
      [tok.user_id]
    )
  })

  await EmailService.sendPasswordResetNoticeEmail(tok.user_email, tok.name || tok.user_email).catch(
    () => {}
  )

  return { success: true }
}

/**
 * 8. Alteração de senha por usuário autenticado (Seção 7).
 */
export async function changePasswordLocal(params: {
  userId: string
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  if (!params.newPassword || params.newPassword.length < 6) {
    return { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." }
  }

  const credRes = await pgQuery(
    `SELECT c.password_hash, u.email, u.name
       FROM public.user_credentials c
       JOIN public.users u ON u.id = c.user_id
      WHERE c.user_id = $1`,
    [params.userId]
  )

  if (credRes.rows.length === 0 || !verifyPassword(params.currentPassword, credRes.rows[0].password_hash)) {
    return { success: false, error: "A senha atual informada está incorreta." }
  }

  const newHash = hashPassword(params.newPassword)
  await pgQuery(
    `UPDATE public.user_credentials
        SET password_hash = $2,
            password_changed_at = now()
      WHERE user_id = $1`,
    [params.userId, newHash]
  )

  await EmailService.sendPasswordResetNoticeEmail(
    credRes.rows[0].email,
    credRes.rows[0].name || credRes.rows[0].email
  ).catch(() => {})

  return { success: true }
}

/**
 * 9. Exclusão de conta do titular com cascata completa (LGPD RNF-005, Seção 7).
 */
export async function deleteUserAccountLocal(userId: string): Promise<{ success: boolean }> {
  await withPgTransaction(async (txQuery) => {
    await txQuery("DELETE FROM public.users WHERE id = $1", [userId])
    await txQuery("DELETE FROM auth.users WHERE id = $1", [userId])
  })
  return { success: true }
}
